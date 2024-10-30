
import express from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

import urlModel from "./models/Url.mjs";
import {URL} from 'url'


function isValidUrl(urlstr){
  try{
    new URL(urlstr)
    return true
  }
  catch(err){
    return false
  }

}

const app = express();


// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/url")
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const requestCount = {}

app.post("/shorten", async (req, res) => {
  const { longUrl, customAlias,expirationTime } = req.body;

 if(isValidUrl(longUrl)){
  const ip = req.ip;

  if(!requestCount[ip] || Date.now() - requestCount[ip].lastReset > 60 * 1000){
    requestCount[ip] = {count: 0, lastReset: Date.now()}

  }

  requestCount[ip].count+=1;
  if(requestCount[ip].count >= 5){
    res.send({message:"Request Limit has exceeded"})
  }
const expiresAt = expirationTime ? Date.now() + expirationTime * 60 * 1000 : null;
  
  if (!longUrl) {
    return res.status(400).json({ error: "Long URL is required" });
  }

  const urlCode = customAlias || nanoid();
  const shortUrl = `http://127.0.0.1/${urlCode}`;

  

  try {
    
  console.log(requestCount[ip])

    let url = await urlModel.findOne({ urlCode });
    if (url)
    {
      return res.status(400).json({ error: "Custom alias already in use" });
      
    } 
    else{
      url = new urlModel({
        longUrl:longUrl,
        shortUrl:shortUrl,
        urlCode:urlCode,
        expiresAt:expiresAt
        
      })
    await url.save();

    res.json({shortUrl:shortUrl});
    }

    
  } catch (err) {
    console.error("Error creating short URL:", err);
    res.status(500).json({ err: "Server error" });
  }

 }else{
  res.status(500).send({message:"Invalid Url"})
 }

 
});




app.get("/:code", async (req, res) => {
  try {
    const url = await urlModel.findOne({ urlCode: req.params.code });
    
    const ip = req.ip;

    

    
    
   

    if (url) {
      // Check for expiration
      if (url.expiresAt && new Date() > url.expiresAt) {
        return res.status(410).send({message: "URL has expired" });
      }
      url.analytics.push({
        ipaddress:req.ip,
        user:req.headers["user-agent"],
        
      })
      // Increment click count and save
      url.clicks += 1;
      await url.save();

      return res.redirect(url.longUrl);
    } else {
      res.status(404).send({ message: "No URL found" });
    }
  } catch (err) {
    console.error("Error redirecting:", err);
    res.status(500).json({ err: "Server error" });
  }
});

app.get("/analytics/:code",async (req,res)=>{

    try{
      const url = await urlModel.findOne({urlCode:req.params.code})
      if(url){
        res.json({
         clickCounts:url.clicks,
         analytics:url.analytics
        })
      }else{
        res.status.json({message:"Url not Found"})
      }

    }
    catch(err){
      console.log(err)
      res.status(500).json({err:"Error Sending Response"})
    }
})

// Start server
app.listen(8000, () => console.log("Server is up and running"));
