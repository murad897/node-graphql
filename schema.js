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
   
   type Product { 
    id : ID,
    image : String,
    name : String,
    mpns : String,
    manifactuler : String,
    user : String,
    checkbox : Boolean,
    searchId  : String,
   }

   input ProductInput {
       id : ID,
       image : String,
       name : String,
       mpns : String,
       manifactuler : String,
       user : String,
       checkbox : Boolean,
       searchId  : String,
   }

   type Query  {
       getUser(token : String ) : User
       getAllUsers : [User]
   }

   type Mutation {
       userRegistrate(input : UserInput) : User
       loginUser(input : UserInput) : User
       createProduct(input :  ProductInput) : Product 
   }

`);

module.exports = schema;
