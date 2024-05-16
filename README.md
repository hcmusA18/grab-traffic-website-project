# grab-traffic-website-project
This is a website built to monitor the air and traffic condition in HCM city as part of Grab Engineering Bootcamp

# To run the app, open 2 terminals:
## Terminal 1:
- CD backend
- python main.py

## Terminal 2:
- CD frontend
- npm start

## Frontend structure:
- src
  - components: contains all the components used in the app
  - pages: contains all the pages used in the app
    - Each page contains a folder with the same name as the page, and contains the page component and its styles. index.tsx is the main component of the page and components which only used in that page are placed in the same folder.
  - assets: contains all the assets used in the app
  - libs: contains all the helper functions used in the app
    - redux: contains all the redux related functions
    - utils: contains all the utility functions
  - App.js: main app component
  - index.js: entry point of the app

  ### React router dom:
  - The app uses react-router-dom to handle routing
  - The app has 3 main pages: Map, Chart and Ranking
  - index of the app is the Map page.
  - Using the RootLayout component to wrap the app and handle the layout of the app