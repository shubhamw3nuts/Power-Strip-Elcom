import Head from "next/head";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { sendGraphQLQuery } from "@/utils/utils";
import { HOME_PAGE } from "@/queries/graphql_queries";
import Banner from "@/components/Banner";
import PriceSec from "@/components/PriceSec";
import StripBox from "@/components/StripBox";
import InsightSec from "@/components/InsightSec";
import QuestionSec from "@/components/QuestionSec";
import BenefitSec from "@/components/BenefitSec";
import ReviewSec from "@/components/ReviewSec";
import VideoSec from "@/components/VideoSec";
import ScrollTextColor from "@/components/ScrollTextColor";
import FeaturesSecNew from "@/components/FeaturesSecNew";
import PowerStripSliderSec from "@/components/PowerStripSliderSec";
import MobileTextColor from "@/components/MobileTextColor";
import MobileFutureSlider from "@/components/MobileFutureSlider";

export default function Home({ data, error }) {
  const router = useRouter();
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleRouteChange = (url) => {
      // console.log('App is changing to:', url);
      // console.log("Router ", router.query);

      if (router.query?.edit && router.query?.edit == 1) {
        const section = sectionRef.current;
        const sectionStyles = window.getComputedStyle(section);
        const marginTop = parseInt(sectionStyles.marginTop, 10);
        const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = sectionTop - marginTop;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    };

    // Subscribe to route change events
    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup subscription on unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  if (error) {
    return <h2>Error: {JSON.stringify(error)}</h2>;
  }

  const {
    bannerHeading, bannerSubHeading, bannerLeftSideImage, bannerRightSideImage, bannerButtonInfo,
    powerStripimage, powerStripleftText, powerStriprightText,
    otherHeading, otherProductInfo,
    reviewsHeading, reviewsInfo,
    insightsHeading, insightsReadMoreLinkText, insightsAllInsightsLink, insightsInfo,
    benefitsHeading, benefitsInfo,
    faqHeading, faqInfo, selectProduct,
    featuresHeading, featuresImage, featuresImageMobile, features1Heading, features1Subheading, features2Heading, features2Subheading, features3Heading, features3Subheading, features4Heading, features4Subheading, features5Heading, features5Subheading,
    exploreHeading, exploreButtonInfo, exploreImagesInfo,
    videoBackgroundImage, videoUrl, videoButtonText
  } = data?.data?.pageBy?.template?.homePageFields;

  const latest3Posts = data?.data?.posts?.nodes;

  const BannerData = { bannerHeading, bannerSubHeading, bannerLeftSideImage, bannerRightSideImage, bannerButtonInfo };
  const otherInfoData = { otherHeading, otherProductInfo };
  const reviewsData = { reviewsHeading, reviewsInfo };
  const insightsData = { insightsHeading, insightsReadMoreLinkText, insightsAllInsightsLink, latest3Posts, insightsInfo };
  const benefitsData = { benefitsHeading, benefitsInfo };
  const faqData = { faqHeading, faqInfo };
  const powerStripData = { powerStripimage, powerStripleftText, powerStriprightText };
  const featuresData = { featuresHeading, featuresImage, featuresImageMobile, features1Heading, features2Heading, features3Heading, features4Heading, features5Heading, features1Subheading, features2Subheading, features3Subheading, features4Subheading, features5Subheading };
  const exploreData = { exploreHeading, exploreButtonInfo, exploreImagesInfo };
  const videoData = { videoBackgroundImage, videoUrl, videoButtonText };

  return (
    <>
      <Head>
        <title>Elcom | Power Strip</title>
      </Head>
      <Banner {...BannerData} />
      <ScrollTextColor {...powerStripData} />
      <MobileTextColor />
      <PriceSec productData={selectProduct} sectionRef={sectionRef} />
      <MobileFutureSlider {...featuresData} />
      <FeaturesSecNew {...featuresData} />
      {videoUrl && <VideoSec {...videoData} />}
      <BenefitSec {...benefitsData} />
      <PowerStripSliderSec {...exploreData} />
      <StripBox {...otherInfoData} />
      <ReviewSec {...reviewsData} />
      <InsightSec {...insightsData} />
      <QuestionSec {...faqData} />
    </>
  );
}

export async function getStaticProps() {
  try {
    const data = await sendGraphQLQuery(HOME_PAGE);
    return {
      props: {
        data
      },
      revalidate: 10
    };
  } catch (error) {
    return {
      props: {
        error
      }
    };
  }
}
