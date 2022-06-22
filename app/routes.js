module.exports = function(app, passport, db, ObjectId, stripe) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('post').find().toArray((err, result) => {
          if (err) return console.log(err)
          var userPosts = 
            result.filter(function(result) {
              if(String(result.user_id)==String(req.user._id)){
                  return true
                  //if the ID of the person logged in, matches the ID of the person who made the POST, display these images
              }
          })
          var loggedUserPosts = 
            result.filter(function(result) {
              if(String(result.user_id)==String(req.user._id)){
                  return true
              }
          })
          console.log(userPosts.length)
          res.render('profile.ejs', {
            user : req.user.local.username,
            posts: userPosts,
            loggedUser: req.user,
            numPosts: userPosts.length,
            loggedUserNumPosts: loggedUserPosts.length,
          })
        })
    });
    //allows me to be able to have all my data, so i dont have to make more than one call
    //can filter it myself

    // GO TO INDIVIDUAL PROFILE PAGE
    app.get('/profile/:userProfile', function(req, res) {
      let userID = req.params.userProfile
      db.collection('post').find().toArray((err, result) => {
        if (err) return console.log(err)
        var userPosts = 
            result.filter(function(result) {
              if(String(result.user_id)==String(userID)){
                  return true
              }
          })
          var loggedUserPosts = 
            result.filter(function(result) {
              if(String(result.user_id)==String(req.user._id)){
                  return true
              }
          })
          console.log(userPosts.length)
          res.render('profile.ejs', {
            user : userPosts[0].name,
            loggedUser: req.user,
            loggedUserNumPosts: loggedUserPosts.length,
            posts: userPosts,
            numPosts: userPosts.length
        })
      })
  }); 
  //this is a way to be a faster of a call
  //only getting one thing you're looking for
  //dont have to do it yourself
  //using mongodb's code, so they can find it, and give it back to you

    app.get('/feed', isLoggedIn, function(req, res) {
        db.collection('post').find().toArray((err, result) => {
          console.log(result);
          if (err) return console.log(err)
          var userPosts = 
            result.filter(function(result) {
              if(String(result.user_id)==String(req.user._id)){
                  return true
              }
          })
          res.render('feed.ejs', {
            user : req.user,
            messages: result,
            numPosts: userPosts.length
          })
        })
    });

    app.get('/market', isLoggedIn, function(req, res) {
      db.collection('market').find().toArray((err, result) => {
        if (err) return console.log(err)
        var userPosts = 
          result.filter(function(result) {
            if(String(result.user_id)==String(req.user._id)){
                return true
            }
        })
        res.render('market.ejs', {
          user : req.user,
          messages: result,
          numPosts: userPosts.length
        })
      })
  });

  app.get('/checkout', isLoggedIn, function(req, res) {
    db.collection('market').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('checkout.ejs', {
        user : req.user,
        messages: result
      })
    })
});

  app.get('/trending', isLoggedIn, function(req, res) {
    console.log(req.body);
      db.collection('post').find().toArray((err, result) => {
        if (err) return console.log(err)
        var userPosts = 
          result.filter(function(result) {
            if(String(result.user_id)==String(req.user._id)){
                return true
            }
        })
        res.render('trending.ejs', {
          user : req.user,
          messages: result,
          numPosts: userPosts.length
        })
      })
  });



app.get('/chat', isLoggedIn, function(req, res) {
  db.collection('messages').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('chat.ejs', {
      user : req.user,
      messages: result
    })
  })
});

app.get('/setting', isLoggedIn, function(req, res) {
  db.collection('messages').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('setting.ejs', {
      user : req.user,
      messages: result
    })
  })
});

  
    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    //req.body is whats inside the form
    //req.user is who's logged in
    //input needs a name inside forms
    const trail = require('path');
    const util = require('util');


    app.post('/create-post', async (req, res) => {
      try{
        const {image} = req.files;
        const fileName = image.name;
        const size = image.data.length;
        const extension = trail.extname(fileName);

        const md5 = image.md5;
        const URL = "/postImg/" + md5  + size + extension;
    
        await util.promisify(image.mv)('./public' + URL );
    
        res.redirect('/feed')
        } catch(err){
          console.log(err);
          res.status(500).json({
            message: err,
          })
        }

      db.collection('post').save({
        user_id: ObjectId(req.user._id),
        name: req.user.local.firstName + " " +req.user.local.lastName, 
        username: req.user.local.username, 
        caption:  req.body.caption,
        image: "/postImg/" + req.files.image.md5 + req.files.image.size + trail.extname(req.files.image.name),
        likes: 0,
        comment: []
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database');
        console.log(req.body);
      })
    })

    app.post('/create-comms', async (req, res) => {
      try{
        const {image} = req.files;
        const fileName = image.name;
        const size = image.data.length;
        const extension = trail.extname(fileName);

        const md5 = image.md5;
        const URL = "/marketImg/" + md5  + size + extension;
    
        await util.promisify(image.mv)('./public' + URL );
    
        res.redirect('/market')
        } catch(err){
          console.log(err);
          res.status(500).json({
            message: err,
          })
        }

      db.collection('market').save({
        user_id: ObjectId(req.user._id),
        name: req.user.local.firstName + " " +req.user.local.lastName, 
        username: req.user.local.username, 
        caption:  req.body.caption,
        image: "/marketImg/" + req.files.image.md5 + req.files.image.size + trail.extname(req.files.image.name),
        price: req.body.price,
        category: req.body.category,
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database');
        console.log(req.body);
      })
    })

    //market payment POST
    const calculateOrderAmount = (items) => {
      // Replace this constant with a calculation of the order's amount
      // Calculate the order total on the server to prevent
      // people from directly manipulating the amount on the client
      return 1400;
    };
    
    app.post("/create-payment-intent", async (req, res) => {
      const { items } = req.body;
    
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(items),
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.put('/likes', (req, res) => {
      console.log(req.body);
      db.collection('post')
      .findOneAndUpdate({_id: ObjectId(req.body._id)}, {
        $set: {
          likes:parseInt(req.body.likes) + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.put('/addComment', (req, res) => {
      let postId = ObjectId(req.body._id)
      db.collection('post')
        .findOneAndUpdate({_id:  postId}, {
          $addToSet: {
            comment: [req.user.local.firstName, req.body.comment]
          }
        }, {
          sort: {
            _id: -1
          },
          upsert: false
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
    })

    app.put('/thumbDown', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp - 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/messages', (req, res) => {
      db.collection('post').findOneAndDelete({_id: ObjectId(req.body._id)}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/feed', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/feed', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
