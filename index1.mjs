import express from 'express';
import { nanoid } from 'nanoid';
import { URL } from 'url';

function isValidUrl(urlstr) {
  try {
    new URL(urlstr);
    return true;
  } catch (err) {
    return false;
  }
}

// Create an empty object to hold urlCode as key with longUrl as value
const urlStore = {}

const requestCount = {}

const app = express();
app.use(express.json());

// POST request for creating a shortened URL
app.post("/shorten", (req, res) => {
  const { longUrl, customAlias,expiringTime } = req.body;
  const ip = req.ip;

  if (isValidUrl(longUrl)) {
// reset requestCount per minute
    if(!requestCount[ip] || Date.now() - requestCount[ip].leastCount > 60 * 1000){
      requestCount[ip] = {count:0, leastCount: Date.now()}
    }

    if(requestCount[ip].count > 5){
      return res.json({message:"Request Limit Exceeded"});
    }

    requestCount[ip].count += 1;

    const expiresAt = expiringTime ? Date.now() + expiringTime * 60 * 1000 : null;
    const urlCode = customAlias || nanoid(6); 
    const shortUrl = `http://localhost:8000/${urlCode}`;
    const clicks = 0;
    const analytics = [{
      ipAddress: "",
      userAgent: "",
      clickCounts: 0
    }]



    urlStore[urlCode] = {longUrl,shortUrl,urlCode,clicks,analytics,expiresAt}
    
    console.log(urlStore)
    console.log(requestCount)
    return res.json({shortUrl})
  } else {
    return res.status(400).json({ message: "Invalid URL" });
  }
});

// GET request for redirecting to the original URL
app.get("/:code",(req,res)=>{

    const {code} = req.params
    console.log(req.params)
    const urlData = urlStore[code]
    console.log(urlData)
    if(urlData.expiresAt && Date.now() > urlData.expiresAt){
      return res.json({message:"Url has expired"})
    }
    if(urlData){
        urlData.clicks+=1;
        urlData.analytics.push({
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          clickCounts: urlData.clicks
        })
        return res.redirect(urlData.longUrl)
       
    }else{
        return res.json({message:"No url is found"})
    }
})

app.get("/analytics/:code",(req,res)=>{
  const {code} = req.params
  const urlData = urlStore[code]
  return res.json(urlData.analytics)
})

app.listen(8000, () => {
  console.log("Server is up and running on http://localhost:8000");
});
