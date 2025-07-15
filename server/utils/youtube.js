const axios = require('axios');


function parseISO8601Duration(duration) {
  // Converts ISO 8601 duration (e.g., PT1H2M10S) to seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || 0, 10);
  const minutes = parseInt(match?.[2] || 0, 10);
  const seconds = parseInt(match?.[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function getYouTubePlaylistVideosWithDurations(playlistId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let videos = [];
  let nextPageToken = '';
  try {
    // Fetch all videos in the playlist (may require multiple pages)
    do {
      const playlistRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlistItems', {
          params: {
            part: 'snippet',
            maxResults: 50,
            playlistId,
            pageToken: nextPageToken,
            key: apiKey,
          }
        }
      );
      const items = playlistRes.data.items;
      videos.push(...items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        // duration will be filled in next step
      })));
      nextPageToken = playlistRes.data.nextPageToken;
    } while (nextPageToken);

    // Fetch durations in batches of 50
    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50);
      const ids = batch.map(v => v.videoId).join(',');
      const detailsRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'contentDetails',
            id: ids,
            key: apiKey,
          }
        }
      );
      const detailsMap = {};
      for (const item of detailsRes.data.items) {
        detailsMap[item.id] = parseISO8601Duration(item.contentDetails.duration);
      }
      // Attach duration to each video in the batch
      for (const video of batch) {
        video.duration = detailsMap[video.videoId] || 0;
      }
    }

    return videos;
  } catch (err) {
    console.error('Error fetching playlist videos with durations:', err?.response?.data || err.message || err);
    return [];
  }
}

module.exports = { getYouTubePlaylistVideosWithDurations };