require("dotenv").config();
const  mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const nodeMailer =require("nodemailer");

// create client 
const client = new mongodb.MongoClient(process.env.DB_URL);


   const transporter = nodeMailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port:  587,
    secure: false,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: 'e45fc3b577d3be',
      pass: 'e621ac72d239eb'
    }
    });
  
const User = (function(){


    /**
     * 
     * @param {*} email 
     * @returns 
     */

    const checkIfEmailExist = async (email) => {

        const feedback = await client.db(process.env.DB_NAME).collection("users").findOne({email:email});

       

        if(feedback){

            return "email exist";
            
        }
        {
        return "email does not exist";

        }
             
    }


    /**
     * 
     * @param {string} firstname 
     * @param {string} lastname 
     * @param {string} email 
     * @param {string} password 
     */


    const createUSerAccount = async (firstname,lastname,email,password)=>{
            //check if the email have been used already
        const result = await checkIfEmailExist(email);

        if(result == "email exist"){
            return{
                message:"this email have been used",
                code:"duplicate error",
                data:{email:email}

            }

        }else{

            var password = await bcrypt.hash(password, 10)
           
             const user ={
                firstname:firstname,
                lastname:lastname,          
                email:email,
                password: password,
                is_email_verify:false
            }
           

          const feedback = await client.db(process.env.DB_NAME).collection("notex").insertOne(user);
          if(feedback){
            return {
                message:"account created successfully",
                code:"success",
                data:{firstname:firstname, lastname:lastname, email:email}
            }
          }
          return {
            message:"could not create account",
            code:"error"
          }
        }


    }

    /**
     * 
     * @param {string} email 
     * @returns 
     */

    const getUserData = async (email)=>{
      const user_data = await client.db(process.env.DB_NAME).collection("users").findOne({email});
       if(user_data){
        return user_data;
       }
       {
        return null;
       }
    }    
    /**
     * 
     * @param {string} email 
     string @param {string} password 
     */
    
    const loginUSer = async (email, password)=>{

        const checkIfEmailExistResult = await checkIfEmailExist(email);
        if(checkIfEmailExistResult === "email exist"){

            let getUserDataResult = await getUserData(email);
            

            if(getUserDataResult !== null ){

                 let current_password = getUserDataResult.password;

                 
                 

                 const checkPassword = await bcrypt.compare(password , current_password)
                if(checkPassword){

                    const date = new Date();

                    const currentTime = date.getTime();

                    const token = `tok_${currentTime}`;

                    const feedback = await client.db(process.env.DB_NAME).collection("users").updateOne({email:email}, {$set:{"is_user_login":true, "login_token":token}})

                    if(feedback){

                        return {
                            message:"user logged in",
                            code:"success",
                            data:{
                                is_user_login:true,
                                user: await client.db(process.env.DB_NAME).collection("users").findOne({email}),
                                token:token
                            }
                        }
                    }

                    
                    
                    
                }
                return{
                    message:"user does not exist",
                    code:"error"
                }
                
            }
            return {
                message:"password does not match",
                code:"error",
                data:null

            }
            
            
        }
        return {
            message:"could not log you in, have you register?",
            code:"error",
            data:null
        }
    }

    // sendEmailVerification

    const sendEmailVerification = async (email)=>{

        const feedback = await transporter.sendMail({
            from:'"notex" <no-reply@example.com>',
            to: email,
            subject: "please verify your email",
            text: "click to verify your email address", // plain text body
            html: "<strong>click to verify your email</strong>" // html body
        });


        if(feedback){
            return true
        }

        return false
    }


 


    return {
        
            createUSerAccount:createUSerAccount,
            loginUSer:loginUSer,
            sendEmailVerification:sendEmailVerification
    }

    


}())
module.exports = User;