import Link from "next/link";
import Image from "next/image";
import thumb1 from '@/asset/images/thumb1.png';
import Select from "react-dropdown-select";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { IndiaStatesList, isValidIndianPhoneNumber, rupeeStringToNumber } from "@/utils/utils";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import Loader from "./Loader";
import { typeOf } from "react-read-more-read-less";

const CheckoutSec = ({ rzpLoaded }) => {
    const router = useRouter();
    const context = useContext(ThemeContext);
    const { products, setProducts,setOrderInfo } = context;
    // console.log("products", products)
    // console.log("rzpLoaded", rzpLoaded)
    const [values, setValues] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({});
    const [productsTotal, setProductTotal] = useState(0)
    const [subTotal, setSubTotal] = useState(0)
    const [lineItems, setLineItems] = useState([]);
    const [taxInfo, setTaxInfo] = useState([])
    const [stateTaxRate, setStateTaxRate] = useState([]);
    const [selectedState, setSelectedState] = useState("")
    const options = IndiaStatesList;


    //woocommerce rest api init
    const api = new WooCommerceRestApi({
        url: process.env.NEXT_PUBLIC_WOO_SITE_URL,
        consumerKey: process.env.NEXT_PUBLIC_WOO_CONSUMER_KEY,
        consumerSecret: process.env.NEXT_PUBLIC_WOO_CONSUMER_SECRET,
        version: "wc/v3"
    });

    useEffect(() => {
        if (products.length > 0) {
            const total = products.reduce((prev, product, index) => {
                // console.log("Product + ", product)
                let productPrice = rupeeStringToNumber(product.price);
                let productQty = product?.selectedQty || 1;
                let currentProductTotal = productPrice * productQty;
                return prev + currentProductTotal;
            }, 0)

            //for order api
            const line_items = products.map((product) => {
                return { product_id: product.databaseId, quantity: product?.selectedQty || 1 }
            })
            setLineItems(line_items);
            setProductTotal(parseFloat(total))
            setSubTotal(parseFloat(total))
        }

        //fetching taxes rates 
        api.get('taxes')
            .then(response => {
                setTaxInfo(response.data);
            })
            .catch(error => {
                console.error('Woocommerce TAX ERROR:', error);
            });

        // document.body.classList.add("loaderActive")
    }, [])

    useEffect(() => {
        if (taxInfo && selectedState != '') {
            let matchingRates = taxInfo.filter(rate => rate.state === selectedState);

            // If no matches are found, check for objects with an empty state
            if (matchingRates.length === 0) {
                matchingRates = taxInfo.filter(rate => rate.state === '');
            }

            // Calculate the total tax based on matching rates
            const totalTax = matchingRates.reduce((total, rate) => {
                return total + (productsTotal * parseFloat(rate.rate) / 100);
            }, 0);

            let finalTotal = (productsTotal + totalTax)
            setStateTaxRate(matchingRates);
            setSubTotal(finalTotal);
        }

    }, [selectedState])

    useEffect(() => {
        if(isLoading){
            document.body.classList.add("loaderActive")
        }else{
            document.body.classList.remove("loaderActive")
        }
    },[isLoading])


    //create wordpress order when User click on Proceed/Checkout button
    const createOrderHandler = async (userDataForOrder) => {
        //if userDataForOrder is not empty then create order
        if (Object.keys(userDataForOrder).length) {
            const orderData = {
                payment_method: 'razorpay',
                payment_method_title: 'Razor Pay Payment',
                set_paid: false,
                billing: userDataForOrder,
                line_items: lineItems
            };
            // creating wordpress order and status is pending payment to retrive order id and amount for razorpay checkout
            api.post('orders', orderData)
                .then(response => {
                    console.log('Woocommerce Order created successfully:', response.data);
                    const orderData = response.data;
                    // console.log(orderData.id);
                    razorPayHandler(orderData)
                })
                .catch(error => {
                    Swal.fire({
                        title: 'Error while creating Woocommerce order',
                        text: error?.response?.data,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                    console.error('Error creating Woocommerce order:', error.response.data);
                    setIsLoading(false);
                });
        }

    }

    const razorPayHandler = async (orderData) => {
        //creating razorpay 
        if (orderData) {
            const orderId = orderData.id;
            const orderAmount = orderData.total;
            const orderUserEmail = orderData?.billing?.email;
            const orderUserFirstName = orderData?.billing?.first_name;
            const orderUserLastName = orderData?.billing?.last_name;
            const orderUserFullName = orderUserFirstName + orderUserLastName;
            const orderUserphone = orderData?.billing?.phone;
            let razorPayOrderID = '';
            try {
                const response = await fetch('/api/createOrder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: orderAmount,
                        currency: 'INR',
                        receipt: String(orderId),
                    }),
                });

                const data = await response.json();
                const { order } = data;
                razorPayOrderID = order.id;

                // Use the order object returned by the API for payment initiation
                // console.log('Razor pay Order created:', order);
                if (window && window.Razorpay && rzpLoaded) {
                    const rzp = new window.Razorpay({
                        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                        amount: order.amount,
                        currency: order.currency,
                        name: 'Elcom',
                        // description: 'Payment for Product/Service',
                        order_id: order.id,
                        handler: function (response) {
                            // console.log("order : L LL L ", order);
                            // console.log(response);
                            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

                            /* updaing woocommer order and add razorpay meta data to it and 
                            update order state from pending payemnt to processing */
                            const updateOrderData = {
                                status: "processing",
                                meta_data: [
                                    {
                                        'key': "razorpay_order_id",
                                        'value': razorpay_order_id
                                    },
                                    {
                                        'key': "razorpay_payment_id",
                                        'value': razorpay_payment_id
                                    },
                                    {
                                        'key': "razorpay_signature",
                                        'value': razorpay_signature
                                    }
                                ]
                            }

                            api.put(`orders/${orderId}`, updateOrderData)
                                .then(response => {
                                    // console.log('updateOrderData Success:', response.data);
                                    setIsLoading(false);
                                    context.setOrderInfo(response.data)
                                    router.push('/payment-successful')
                                })
                                .catch(error => {
                                    setIsLoading(false);
                                    Swal.fire({
                                        title: 'Error while updating order',
                                        text: error.response.data,
                                        icon: 'error',
                                        confirmButtonText: 'Ok'
                                    })
                                    console.error('updateOrderData ERROR:', error.response.data);
                                });
                        },
                        prefill: {
                            name: orderUserFullName,
                            email: orderUserFullName,
                            contact: orderUserphone,
                        },
                        // notes: {
                        //     address: 'Razorpay Corporate Office',
                        // },
                        theme: {
                            color: '#0071E3',
                        },
                        modal: {
                            ondismiss: async function (dismissdata) {
                                // console.log("Checkout form closed", dismissdata);
                                // Handle the close event here

                                //updating woocommerce order and make state pendingpayment to failed
                                const updateOrderData = { status: "failed", }
                                api.put(`orders/${orderId}`, updateOrderData)
                                    .then(response => {
                                        // console.log('update order failed Success:', response.data);
                                        setIsLoading(false);
                                        // setProducts([])
                                        // router.push('/payment-failed')
                                    })
                                    .catch(error => {
                                        setIsLoading(false);
                                        Swal.fire({
                                            title: 'Error while updating order',
                                            text: error.response.data,
                                            icon: 'error',
                                            confirmButtonText: 'Ok'
                                        })
                                        console.error('updateOrderData ERROR:', error.response.data);
                                    });

                                // update razorpay order and add custom notes to it  
                                const response = await fetch('/api/updateOrder', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        orderId: razorPayOrderID,
                                    }),
                                });
                                const data = await response.json();
                            },
                            confirm_close: true
                        }
                    });
                    rzp.open();

                    rzp.on('payment.failed', function (response) {
                        // Handle payment failure
                        console.error('Payment failed:', response.error.code, response.error.description);
                        // setIsLoading(false);
                        // context.setPaymentErrorHandler(response.error);
                        // setProducts([])
                        // router.push('/payment-failed')
                        // rzp.close();
                        // console.error('Payment failed:', response);
                    });
                }

            } catch (error) {
                setIsLoading(false);
                Swal.fire({
                    title: 'Error while creating order',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                console.error('Error creating order:', error.message);
            }
        }
    }

    return (
        <>
            {isLoading && <Loader />}
            <div className="chekoutWrap">
                <div className="container">
                    <div className="checkoutGrp">
                        <Formik
                            initialValues={{ name: '', email: '', mobile: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', state: '', privacyStatementCb: false }}
                            validate={values => {
                                const errors = {};
                                const requiredFieldMessage = 'This field is required!';
                                if (values?.name?.trim() == '') {
                                    errors.name = requiredFieldMessage
                                }
                                if (values?.mobile?.trim() == '') {
                                    errors.mobile = requiredFieldMessage
                                } else if (!isValidIndianPhoneNumber(values?.mobile)) {
                                    errors.mobile = "Please enter valid mobile number!"
                                }

                                if (values?.addressLine1?.trim() == '') {
                                    errors.addressLine1 = requiredFieldMessage
                                }
                                if (values?.addressLine2?.trim() == '') {
                                    errors.addressLine2 = requiredFieldMessage
                                }
                                if (values?.city?.trim() == '') {
                                    errors.city = requiredFieldMessage
                                }
                                if (values?.pincode?.trim() == '') {
                                    errors.pincode = requiredFieldMessage
                                }
                                if (!values.email) {
                                    errors.email = requiredFieldMessage
                                } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                                    errors.email = 'Invalid email address!';
                                }
                                if (!values.state) {
                                    errors.state = 'Please select a state!';
                                }

                                if (!values.privacyStatementCb) {
                                    errors.privacyStatementCb = requiredFieldMessage
                                }

                                return errors;
                            }}
                            onSubmit={(values, { setSubmitting }) => {
                                // console.log("values : ", values)
                                let fullName = values.name;
                                let fullNameArr = fullName.trim().split(" ");
                                let firstName = '';
                                let lastName = '';
                                if (fullNameArr.length > 1) {
                                    firstName = fullNameArr[0];
                                    lastName = fullNameArr[fullNameArr.length - 1];
                                } else {
                                    firstName = fullName;
                                    lastName = '';
                                }
                                const userDataForOrder = {
                                    first_name: firstName,
                                    last_name: lastName,
                                    address_1: values?.addressLine1,
                                    address_2: values?.addressLine2,
                                    city: values?.city,
                                    state: values?.state[0].id,
                                    postcode: values?.pincode,
                                    country: 'IN',
                                    email: values?.email,
                                    phone: values?.mobile
                                }
                                setUserData(userDataForOrder)
                                setSubmitting(false);
                                setIsLoading(true)
                                createOrderHandler(userDataForOrder);
                            }}
                        >
                            {({
                                values,
                                errors,
                                touched,
                                handleChange,
                                handleBlur,
                                handleSubmit,
                                isSubmitting,
                                /* and other goodies */
                            }) => {
                                // if(values.state != '' && values.state.length > 0){
                                //     let selectedState = values.state[0].id;
                                //     console.log("selectedState : ",selectedState)
                                // }
                                return (
                                    <Form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-lg-7">
                                                <div className="checkoutForm">
                                                    <div className="checkoutNav">
                                                        <ul>
                                                            <li className="powerDirect">
                                                                <Link href={'/'}>Powerstrip</Link>
                                                            </li>
                                                            <li className="checkoutDirect">
                                                                <Link href={'#'} onClick={(e) => {e.preventDefault()}}>Checkout</Link>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    <div className="checkoutBox">
                                                        <div className="personalDtl">
                                                            <div className="checkoutHead">
                                                                <h2>Checkout</h2>
                                                            </div>
                                                            <div className="innerForm">
                                                                <div className="innerHead">
                                                                    <h4>Personal  Details</h4>
                                                                </div>
                                                                <div className="innerformDtl">
                                                                    <div className='contactInner'>
                                                                        <Field type="text" name="name" placeholder="Name" onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.name} />
                                                                        <ErrorMessage name="name" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className='contactInner'>
                                                                        <Field type="tel" name="mobile" placeholder="Mobile Number"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.mobile}
                                                                        />
                                                                        <ErrorMessage name="mobile" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className={`contactInner`}>
                                                                        <Field type="email" name="email" placeholder="Email"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.email} />
                                                                        <ErrorMessage name="email" component="div" className="errorMessage" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="innerForm">
                                                                <div className="innerHead">
                                                                    <h4>Shipping Details</h4>
                                                                </div>
                                                                <div className="innerformDtl">
                                                                    <div className='contactInner'>
                                                                        <Field type="text" name="addressLine1" placeholder="Address line 1"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.addressLine1} />
                                                                        <ErrorMessage name="addressLine1" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className='contactInner'>
                                                                        <Field type="text" name="addressLine2" placeholder="Address line 2"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.addressLine2} />
                                                                        <ErrorMessage name="addressLine2" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className='contactInner'>
                                                                        <Field type="text" name="city" placeholder="City"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.city} />
                                                                        <ErrorMessage name="city" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className="contactInnerselect">
                                                                        <Field name="state">
                                                                            {({ field, form }) => (
                                                                                <Select
                                                                                    {...field}
                                                                                    options={options}
                                                                                    labelField="name"
                                                                                    valueField="id"
                                                                                    placeholder="State"
                                                                                    onChange={(option) => {
                                                                                        if (option.length) {
                                                                                            setSelectedState(option[0].id);
                                                                                        }
                                                                                        form.setFieldValue(field.name, option)
                                                                                    }}
                                                                                    onBlur={() => form.setFieldTouched(field.name, true)}
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                        <ErrorMessage name="state" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className='contactInner'>
                                                                        <Field type="text" name="pincode" placeholder="PIn code" min="0"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.pincode} />
                                                                        <ErrorMessage name="pincode" component="div" className="errorMessage" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-5">
                                                <div className="titleBox">
                                                    <div className="orderInner">
                                                        <div className="titleHead">
                                                            <h4>Your order</h4>
                                                        </div>
                                                        {(products.length > 0) ?
                                                            <>
                                                                {products?.map((product, index) => {
                                                                    return (
                                                                        <div className="orderBox" key={index}>
                                                                            {product?.image?.sourceUrl && <div className="orderImg">
                                                                                <Image src={product?.image?.sourceUrl} width={120} height={120} alt="thumb1"></Image>
                                                                            </div>}
                                                                            <div className="orderDtl">
                                                                                <ul>
                                                                                    <li className="orderHead">{product.name}</li>
                                                                                    {product?.sku && <li>Product code : {product?.sku}</li>}
                                                                                    {product?.attributes?.nodes.map((attribute) => {
                                                                                        const { label, id, value } = attribute;
                                                                                        return <li key={id}>Product {label} : {value}</li>
                                                                                    })}
                                                                                    {product?.selectedQty && <li>Quantity : {product.selectedQty}</li>}
                                                                                </ul>
                                                                                <div className="editBtn">
                                                                                    <Link href={`/?edit=1`}>Edit</Link>
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    )
                                                                })}
                                                                <div className="totalDtl">
                                                                    <div className="totalBox">
                                                                        <ul>
                                                                            <li>
                                                                                <p>Total</p>
                                                                                <span>₹ {productsTotal.toFixed(2)}/-</span>
                                                                            </li>
                                                                            {/* {JSON.stringify(stateTaxRate)} */}
                                                                            {stateTaxRate.length == 0 &&
                                                                                <li>
                                                                                    <p>Tax</p>
                                                                                    <span>₹ 0/-</span>
                                                                                </li>
                                                                            }
                                                                            {
                                                                                stateTaxRate.length > 0 && stateTaxRate.map((info, index) => {
                                                                                    return (<li key={index}>
                                                                                        <p>{info.name} Tax {parseFloat(info.rate).toFixed(2)}%</p>
                                                                                        <span>₹ {(productsTotal * parseFloat(info.rate) / 100).toFixed(2)}/-</span>
                                                                                    </li>)
                                                                                })
                                                                            }
                                                                            <li>
                                                                                <p>Shipping</p>
                                                                                <span>₹ 00/-</span>
                                                                            </li>
                                                                            <li>
                                                                                <p className="subHead">Subtotal</p>
                                                                                <span className="totalRs">₹ {subTotal.toFixed(2)}/-</span>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                                <div className="btnCheckbox">
                                                                    <div className="checkbox_wrap">
                                                                        <label>
                                                                            <Field type="checkbox" name="privacyStatementCb"
                                                                                onChange={handleChange}
                                                                                onBlur={handleBlur}
                                                                            />
                                                                            <span>{`I've taken notice of the`} <Link target="" href="/privacy-policy">Privacy Statement</Link></span>
                                                                        </label>
                                                                        <ErrorMessage name="privacyStatementCb" component="div" className="errorMessage" />
                                                                    </div>
                                                                    <div className="proceedBtn">
                                                                        <button type="submit" disabled={isSubmitting}>
                                                                            Proceed
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                            : <h5>Please add product to checkout from <Link href={"/"}>here.</Link></h5>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Form>
                                )
                            }}
                        </Formik>
                    </div>
                </div >
            </div >
        </>
    )
}

export default CheckoutSec;