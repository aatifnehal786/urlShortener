import mongoose from "mongoose";

const urlSchema = mongoose.Schema({
  longUrl:{
    type:String,
    required:true
  },
  shortUrl:{
    type:String,
    required:true
  },
  urlCode:{
    type:String,
    required:true,
    unique:true
  },
  clicks:{
    type:Number,
    default:0
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  expiresAt:{
    type:Date,
    default:null
  },
  analytics:[
    {
    ipaddress: String,
    user: String,
    accessedAt:{
      type: Date,
      default: Date.now
    }
    }
]
 
})

const urlModel = mongoose.model("datas", urlSchema);

export default urlModel
