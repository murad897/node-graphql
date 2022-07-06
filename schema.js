const { buildSchema } = require("graphql");

const schema = buildSchema(`
   type User { 
       id : ID
       first_name : String   
       last_name : String
       email : String 
       password : String 
       token :  String  
   }

   input UserInput {
       id : ID
       first_name : String   
       last_name : String
       email : String 
       password : String 
       token :  String  
   }

   type Query  {
       getUser(token : String ) : User
       getAllUsers : [User]
   }

   type Mutation {
       userRegistrate(input : UserInput) : User
   }

`);

module.exports = schema;
