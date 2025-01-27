export const THEME_SETTINGS = `
query THEME_SETTINGS {
    themeGeneralSettings{
      themeGeneralSettings{
        headerLogo{
          sourceUrl
        }
        menuInfo{
          link{
            title
            target
            url
          }
          scrollToSectionLink
        }
        ctaOneInfo{
          title
          target
          url
        }
        ctaTwoInfo{
          title
          target
          url
        }
        footerCopyrightInfo
        footerElcomLink{
          title
          target
          url
        }
        twitterUri
        linkedinUri
        facebookUri
        youtubeUri
        pdfLogo{
          sourceUrl
        }
        pdfAddressInfo
        pdfGstInfo
        pdfInvoiceText
        pdfOrderDateText
        pdfCustomerDetailsText
        pdfShippingAddressText
        pdfProductCodeText
        pdfProductNameText
        pdfColorText
        pdfQuantityText
        pdfPriceText
        pdfSubtotalText
        pdfShippingText
        pdfTotalText
        pdfThankYouText
        successImage {
          sourceUrl
        }
        successHeading
        successDescription
        successDownloadInvoiceButtonText
        successBackHomeText
        successBackHomeButtonText
        failImage{
          sourceUrl
        }
        failHeading
        failDescription
        failRetryButtonText
        failBackHomeText
        failBackHomeButtonText
      }
    }
  }
`
export const HOME_PAGE = `
query THEME_SETTINGS {
    themeGeneralSettings{
      themeGeneralSettings{
        headerLogo{
          sourceUrl
        }
        menuInfo{
          link{
            title
            target
            url
          }
          scrollToSectionLink
        }
        ctaOneInfo{
          title
          target
          url
        }
        ctaTwoInfo{
          title
          target
          url
        }
        footerCopyrightInfo
        footerElcomLink{
          title
          target
          url
        }
        twitterUri
        linkedinUri
        facebookUri
        youtubeUri
        pdfLogo{
          sourceUrl
        }
        pdfAddressInfo
        pdfGstInfo
        pdfInvoiceText
        pdfOrderDateText
        pdfCustomerDetailsText
        pdfShippingText
        pdfProductCodeText
        pdfProductNameText
        pdfColorText
        pdfQuantityText
        pdfPriceText
      }
    }
    pageBy(uri: "/") {
        template {
            ... on HomePageTemplate {
                homePageFields {
                    bannerHeading
                    bannerSubHeading
                    bannerLeftSideImage {
                        sourceUrl
                    }
                    bannerRightSideImage {
                        sourceUrl
                    }
                    bannerButtonInfo {
                        title
                        url
                        target
                    }
                    powerStripimage{
                      sourceUrl
                    }
                    powerStripleftText
                    powerStriprightText
                    featuresHeading
                    featuresImage{
                      sourceUrl
                    }
                    featuresImageMobile{
                      sourceUrl
                    }
                    features1Heading
                    features1Subheading
                    features2Heading
                    features2Subheading
                    features3Heading
                    features3Subheading
                    features4Heading
                    features4Subheading
                    features5Heading
                    features5Subheading
                    videoBackgroundImage{
                      sourceUrl
                    }
                    videoUrl
                    videoButtonText
                    otherHeading
                    otherProductInfo {
                        productName
                        productImage {
                            sourceUrl
                        }
                        largeWidthBox
                    }
                    reviewsHeading
                    reviewsInfo{
                      name
                      description
                    }
                    insightsHeading
                    insightsReadMoreLinkText
                    insightsAllInsightsLink{
                      title
                      url
                      target
                    }
                    insightsInfo{
                      image{
                        sourceUrl
                      }
                      categoryName
                      title
                      link
                    }
                    benefitsHeading
                    benefitsInfo{
                      title
                      image{
                        sourceUrl
                      }
                    }
                    exploreHeading
                    exploreButtonInfo{
                      title
                      url
                      target
                    }
                    exploreImagesInfo{
                      image{
                        sourceUrl
                      }
                    }
                    faqHeading
                    faqInfo{
                      heading
                      description
                    }
                    selectProduct {
                      __typename
                      ... on VariableProduct {
                        id
                        name
                        price
                        content
                        attributes {
                          nodes {
                            id
                            label
                            name
                            options
                            variation
                            optionsWithFields {
                              name
                              slug
                              value
                              colorCode
                            }
                          }
                        }
                        featuredImage{
                          node{
                            sourceUrl
                          }
                        }
                        galleryImages{
                          nodes{
                            sourceUrl
                          }
                        }
                        variations {
                          nodes {
                            databaseId
                            sku
                            name
                            price
                            regularPrice
                            salePrice
                            image {
                              sourceUrl
                            }
                            attributes {
                              nodes {
                                id
                                name
                                label
                                value
                              }
                            }
                          }
                        }
                        productExtraOptions{
                          isProductMadeInIndia
                          productWarranty
                          productInfo{
                            heading
                            value
                          }
                        }
                      }
                      ... on SimpleProduct {
                        id
                        name
                      }
                    }
                }
            }
        }
    }
    posts(first: 3, where: {status: PUBLISH}) {
      nodes {
        title
        uri
        categories{
          nodes{
            name
          }
        }
        featuredImage{
          node{
            sourceUrl
          }
        }
      }
    }
  }
`