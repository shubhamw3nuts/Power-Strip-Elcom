import Image from "next/image"
import Link from 'next/link';
import ivideoimg from "@/asset/images/ivideoimg.png";
import { useEffect, useState } from "react";
import { addAutoplayParam, checkVideoPlatform, formatDuration, parseDuration } from "@/utils/utils";
import axios from "axios";


const VideoSec = () => {
    const [showVideo, setShowVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [videoDetails,setVideoDetails] = useState();
    const url = "https://www.youtube.com/watch?v=D0UnqGm_miA";
    // const url = "https://vimeo.com/46926279";
    let updatedURL = '';
    //getting plateform of given URL (eg. Youtube,Vimeo)
    const videoPlatForm = checkVideoPlatform(url);

    if(videoPlatForm == 'YouTube' || videoPlatForm == 'Vimeo'){
        updatedURL = addAutoplayParam(url)
        console.log('updatedURL',updatedURL)
    }

    //get Youtube video id from url
    const getVideoIdFromUrl = (url) => {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
    };

    //fetch Youtube video details from video id
    const fetchYoutubeVideoDetails = async (videoId) => {
        try {
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.NEXT_PUBLIC_YOUTUBE_KEY}`
            );
            const video = response.data.items[0];
            const title = video.snippet.title;
            const duration = parseDuration(video.contentDetails.duration);
            setVideoDetails({
                title,
                duration,
            });
        } catch (error) {
            console.error('Error fetching video details:', error);
        }
    };

    const fetchVimeoVideoDetails = async (oEmbedUrl) => {
        fetch(oEmbedUrl)
        .then(response => response.json())
        .then(data => {
            const title = data.title;
            const duration = formatDuration(data.duration); // Duration is in seconds
            setVideoDetails({
                title,
                duration,
            });
        })
        .catch(error => console.error('Error fetching video details:', error));
    }

    useEffect(() => {
        if(videoPlatForm == 'YouTube'){
            const videoId = getVideoIdFromUrl(url);
            fetchYoutubeVideoDetails(videoId);
        }else if(videoPlatForm == 'Vimeo'){
            const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
            fetchVimeoVideoDetails(oEmbedUrl);
        }
    }, []);
    return (
        <>
            <div className="videoGrp">
                <div className="container">
                    <div className="videoPlayer">
                        <div className="videoWrapper">
                            {!showVideo && <div className="videoFrame">
                                <Image src={ivideoimg} alt="ivideoimg" />
                            </div>}
                            <div class="video-blk">
                                <iframe width="1000" height="500" src={videoUrl} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                            </div>
                            {!showVideo && <div className="trailerText">
                                {videoDetails?.title && <div className="trailorSec">
                                    <p>{videoDetails?.title}</p>
                                </div>}
                                <div className="blueBtn">
                                    <Link href="/" onClick={(e) => { e.preventDefault(); setVideoUrl(updatedURL); console.log(updatedURL); setShowVideo(true) }}>watch video</Link>
                                </div>
                                {videoDetails?.duration && <div className="timerSec">
                                    <span>{videoDetails?.duration}</span>
                                </div>}
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default VideoSec;