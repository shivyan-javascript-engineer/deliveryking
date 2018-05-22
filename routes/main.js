var router = require('express').Router();
var Category = require('../models/category');
var Product = require('../models/product');
var Order = require('../models/order');
var http = require('http');


router.get('/', function(req, res, next) {
  Product.find({ mainSection1: true }, { mainSection2: true } ).select("name _id prod_short_desc price mainSection1 nonVeg").exec(function(err, products) {

    if (err) return next(err);
    else{
      console.log("shiy");
        res.render('main/home',{
          products:products,
            user : req.user
        });

      // res.json({
      //   products:products
      // });
    }

});


});

// router.get('/foods', function(req, res, next)
// {
//   res.render('main/food_description');
// });




router.get('/food/:foodTitle', function(req, res, next) {
  const prodName = req.params.foodTitle.replace(/-/g, " ");
  console.log(prodName);
  Product.find({ name: prodName }).populate('category').limit(1).exec(function(err, product) {


  Product
    .find({ category: product[0].category._id , _id: { $ne: product[0]._id }} )
    .populate('category')
    .limit(3)
    .exec(function(err, products) {
      if (err) return next(err);
      else
      {
         console.log(product);
      res.render('main/food_description',{
        product,
        products,
        user : req.user
      });
      }

    });




});

});

router.get('/foodCart/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id },function(err, product) {
    if (err) return next(err);
    else
    {
    res.status(201).json({
      product:product
    });
    }
});

});

//live search
router.get('/search', function(req, res, next) {
  if (req.query.term) {
    var regex = new RegExp(req.query["term"], 'i');
    var query = Product.find({name: regex}).select('_id name').limit(13);

       // Execute query in a callback and return users list
   query.exec(function(err, foods) {
       if (!err) {
          // Method to construct the json result set
          res.status(200).json(foods);
       } else {
        res.status(500).json(err);
       }
    });
  }
});

router.get('/checkout',(req, res, next)=>
{
res.render('main/checkout',{
    user : req.user
});
});

router.get('/about',(req, res, next)=>
{
res.render('main/about',{
    user : req.user
});
});


router.get('/privacy-policy',(req, res, next)=>
{
  res.render('main/terms',{
      user : req.user
  });
});

router.put('/review/:productId',(req,res,next)=>{
  const id = req.params.productId;
  console.log("shivy hiteted");
  console.log(req.body);
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  console.log(updateOps);
  Product.update({ _id: id }, { $set: updateOps })
    .exec()
    .then(result => {
      console.log(result);
      res.status(200).json({
        message: "Your Review Matters To Us.",
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});




//add order
router.post('/add-order', function(req, res, next) {
  var order = new Order();
  order.customer = req.body.customer;
  if(req.body.customerId != null) order.customerId = req.body.customerId;
  order.total = req.body.total;
  order.items = req.body.items;
  order.paymentMethod = req.body.paymentMethod;
  order.addressDetails = req.body.addressDetails;
  order.customerContact = req.body.customerContact;
  order.successful = req.body.successful;

  order.save(function(err,result) {
    if (err)
    {
      return res.status(500).json({
        error:err
      });
    }
    else
    {
    // req.flash('success', 'Successfully added a category');
    http.get(`http://makemysms.in/api/sendsms.php?username=MOBIAPI&password=makemysms@123&sender=MOBSFT&mobile=${req.body.customerContact}&type=1&product=1&message=Your order has been successfully fulfiled. Order Id: ${result._id}`, (resp) => {
      var data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(JSON.parse(data));
        return res.status(201).json('Success');
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });

   }
  });
});



router.post('/gateway-order', function(req, res, next) {
  var order = new Order();
  order.customer = req.body.customer;
  if(order.customerId !=null) order.customerId = req.body.customerId;
  order.total = req.body.total;
  order.items = req.body.items;
  order.paymentMethod = req.body.paymentMethod;
  order.addressDetails = req.body.addressDetails;
  order.customerContact = req.body.customerContact;
  order.successful = req.body.successful;
  order.save(function(err,result) {
    if (err)
    {
      return res.status(500).json({
        error:err
      });
    }
    else
    {
    res.status(201).json({order_id:result._id});
   }
  });
});


router.get('/allOrders', function(req, res, next) {

  Order.find({}).sort({date: -1}).exec(function(err, orders) {

    if (err) res.status(500).json({err:err});
    else{

      res.status(201).json({
      orders:orders
      });
    }

});

});







// router.get('/account/edit', function(req, res, next) {
//   res.render('user/profileEdit',{
//     user : req.user
//   });
// })

router.get('/account/orders', function(req, res, next) {
  Order.find({customerId:req.user._id}).populate('items._id').sort({date: -1}).exec(function(err, orders) {

    if (err) res.status(500).json({err:err});
    else{

      res.render('user/orders',{
        user : req.user,
        orders
      });



    }

});

})

router.put('/order/:orderId',(req,res,next)=>{
  const id = req.params.orderId;
  console.log("shivy hiteted");
  const updateOps = {};
    updateOps['successful'] = true;

  console.log(updateOps);
  Order.update({ _id: id }, { $set: updateOps })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "Order Successfully Updated.",
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});



//export mainRoutes

module.exports = router;
