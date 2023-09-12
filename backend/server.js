const express = require("express");
const  mongodb = require("mongodb");
const objectID = mongodb.ObjectId
const session = require("express-session");
const mongoDBstore = require("connect-mongodb-session");
const mongoDBStore = mongoDBstore(session)
const cors = require("cors")
const user = require("./User/Auth");


require("dotenv").config();

const client = new mongodb.MongoClient(process.env.DB_URL);


const store = new mongoDBStore({ 
  uri:"mongodb://127.0.0.1:27017/user_login_session",
  collection:"sessions"

})
//define server app

const server = express();

server.use(cors());

server.use(express.json());



server.use(session({
  secret:"THISISMYKEY",
  saveUninitialized:false,
  store:store

}))




server.post("/register-user", async (request, response)=>{
  


    //check user information
    let firstname = request.body.firstname.trim();
    let lastname = request.body.lastname.trim();
    let email = request.body.email.trim();
    let password = request.body.password.trim();

    if(firstname.length > 0 && lastname.length >0 && email.length > 0 && password.length > 0){

     const feedback = await user.createUSerAccount(firstname,lastname,email,password)
      if(feedback.code == "success"){

        const email_verification_result = await user.sendEmailVerification(email);

        if(email_verification_result){

          return response.send({
              message:"account created successfully",
              code:"success",
              data:{firstname:firstname,lastname:lastname,  email:email}
          })
        }
      }
      return response.send({
        message:"could not create user",
    
      })



    }

    return response.send({
        message:"all field must be fill",
        code:"error",
        data:null
    })

})


server.post("/login-user", async (request,response)=>{

  let email = request.body.email.trim();
  let password = request.body.password.trim();

  if(email.length == 0 || password.length == 0){

    response.send({

      message:"email and password are required",
      code:"error",
      data:null

    })
  }
  const result = await user.loginUSer(email,password);
  if(result.code == 'error'){
    return response.send({
      message:result.message,
      code:result.code,
      data:null
    })
  }
  else{
    request.session.user = result.data
    return response.send({
      message:result.message,
      code:result.code,
      data:result.data,
      session:request.session.id
    })

  }

})

server.post("/create-note", async(request,response)=>{

  let note_tittle,note_content,token;

  if(request.body.note_tittle && request.body.note_content){
   
    note_tittle = request.body.note_tittle.trim();
    note_content = request.body.note_content.trim();
    
   const feedback = await client.db(process.env.DB_NAME).collection("notex").insertOne({note_tittle,note_content});
    if(feedback){
      const token = feedback.insertedId
      const  result = await client.db(process.env.DB_NAME).collection("notex").findOne({_id:token});
      if(result){
        return response.send({
          message:"note created successful",
          code:"success",
          data:result
        })
      }else{
        console.log("can not return user data")
      }
     

  }else{
        return response.send({
         message:"could not create"
         })
       }

  } 
    else{
    return response.send( {
      message:"no value was passed  please enter something",
      code:"error",
      data:null
    })
  }

});

server.post("/delete-note", async (request,response)=>{

  if(!request.body.noteId){
    return response.send({
      message:"no noteID was provided",
      code:"error",
      data:null
    })

  }else{
    const noteId = request.body.noteId.trim();
    if(noteId.length == 0){
      return response.send({
        message:"no noteID was provided",
        code:"error",
        data:null
      })
    }else{
      const feedback = await client.db(process.env.DB_NAME).collection("notex").deleteOne({_id:new objectID('64dd3f1620b8e1efb64e54b9')});
      if(feedback){
        return response.send({
          message:"note deleted successfull",
          code:"success",
          data:{feedback:feedback}
        })
      }else{
        return response.send({
          message:"could not delete",
          code:"error",
          data:null
        })
      }
    }
  }
  
  });

  server.post("/get-note", async (request, response)=>{
    const token = request.body.token.trim();
    const feedback = await client.db(process.env.DB_NAME).collection("notex").findOne({_id:token})
  })

  server.post("/update-note",async (request, response)=>{

    const _id = request.body._id;
    // const note_tittle = request.body.note_tittle;
    // const note_content = request.body.note_content;
    // const newNote_content = request.body.newNote_content;

    if(!_id){
      
      return response.send({
        message:"note could not update",
        code:"error",
        data:null
      })
    }else{
      
      const feedback = await client.db(process.env.DB_NAME).collection("notex").updateOne({_id :new objectID('64e346fef880a54ed8cc04ef')},{$set:{note_tittle:"samuel",note_content:"another updated note"}});
      if(feedback){
        return response.send({
          message:"note updated",
          code:"success",
          data:{feedback}
        })
      }else{
        return {
          message:"note could not update"
          
        }
      }
    }

  
  });



server.post("/logout-user", (request, response)=>{

  const token = request.body.token;

  request.session.destroy(function(){
    return response.send({
      message:"user session destroyed",
      code:"logout-success",
      data:null,
      type:"logout-user"
    });
  })
});








//create a port 
const PORT = process.env.PORT;
//listening
server.listen(PORT,()=>{console.log(`server is listening to PORT ${PORT}`)})
