/********************************************************************************
 * WEB322 – Assignment 05
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name:Ana Masoumi Student ID: 151438231 Date: 11/22/2024
 *
 * Published URL: https://web322-orpin.vercel.app/
 *
 ********************************************************************************/
const express = require("express");
const legoData = require("./modules/legoSets");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Set view engine to EJS
app.set("view engine", "ejs");

// Set views directory
app.set("views", `${__dirname}/views`);

// Serve static files from public directory
app.use(express.static(`${__dirname}/public`));

// Initialize legoData then start server
legoData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server is running at http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.error("failed to initialize lego data:", err);
  });

// Home route
app.get("/", (req, res) => {
  res.render("home");
});

// About route
app.get("/about", (req, res) => {
  res.render("about");
});

// Route to display all sets or filter by theme
app.get("/lego/sets", (req, res) => {
  const theme = req.query.theme;
  if (theme) {
    legoData
      .getSetsByTheme(theme)
      .then((data) => {
        if (data.length === 0) {
          res.status(404).render("404", {
            message: "No sets found for the specified theme.",
          });
        } else {
          res.render("sets", { sets: data, theme });
        }
      })
      .catch(() => {
        res.status(500).render("500", {
          message: "An error occurred while fetching the sets by theme.",
        });
      });
  } else {
    legoData
      .getAllSets()
      .then((data) => {
        res.render("sets", { sets: data });
      })
      .catch(() => {
        res.status(500).render("500", {
          message: "An error occurred while fetching all sets.",
        });
      });
  }
});

// Route for individual set pages
app.get("/lego/set/:set_num", (req, res) => {
  const setNum = req.params.set_num;
  legoData
    .getSetByNum(setNum)
    .then((data) => {
      if (!data) {
        res.status(404).render("404", { message: "Set not found." });
      } else {
        res.render("set", { set: data });
      }
    })
    .catch(() => {
      res.status(500).render("500", {
        message: "An error occurred while fetching the set.",
      });
    });
});

// Route to serve the "Add Set" form
app.get("/lego/addSet", (req, res) => {
  legoData
    .getAllThemes()
    .then((themes) => {
      res.render("addSet", { themes }); // Render addSet view with themes
    })
    .catch((err) => {
      res.render("500", { message: `Error fetching themes: ${err}` });
    });
});

// Route to handle form submission for adding a new set
app.post("/lego/addSet", (req, res) => {
  const setData = req.body; // Retrieve form data
  legoData
    .addSet(setData)
    .then(() => {
      res.redirect("/lego/sets"); // Redirect to sets page on success
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we encountered an error: ${err}`,
      });
    });
});

// Route to render edit set page
app.get("/lego/editSet/:num", (req, res) => {
  const setNum = req.params.num;

  // Retrieve the set and themes in parallel
  Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
    .then(([setData, themeData]) => {
      res.render("editSet", { set: setData, themes: themeData });
    })
    .catch((err) => {
      res.status(404).render("404", {
        message: `Error retrieving set or themes: ${err}`,
      });
    });
});

// Route to handle form submission for editing a set
app.post("/lego/editSet", (req, res) => {
  const setNum = req.body.set_num;
  const setData = req.body;

  legoData
    .editSet(setNum, setData)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

// DELETE route for deleting a Lego set
app.get("/lego/deleteSet/:num", (req, res) => {
  const setNum = req.params.num;

  // Call the deleteSet function
  legoData
    .deleteSet(setNum)
    .then(() => {
      // Redirect to the sets list page after successful deletion
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      // Render the 500 error view if there's an issue
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});
// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for.",
  });
});

// Export the app for Vercel
module.exports = app;
