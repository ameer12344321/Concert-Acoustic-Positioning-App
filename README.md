# Concert Acoustic Positioning App

A web based tool that uses physics to help concertgoers find the best spot to stand for the best sound quality. Built for the National PhysXHackathon 2026.

## Live Demo

## How It Works

The user enters a few things about the concert setup (stand area size, speaker positions, temperature, and wind if outdoor). The app then uses four physics concepts plus a safety rule to calculate a sound quality map and show the best spot to stand.

The four physics concepts used are:
1. Inverse square law (sound gets weaker with distance)
2. Speed of sound vs temperature (warm air = faster sound)
3. Wave interference and superposition (waves from multiple speakers combine)
4. Wind refraction (wind bends sound outdoors)

A 3 metre safety radius is also applied around each speaker to prevent the best spot from being placed in dangerous high volume zones.

## File Structure

The app is built with three main files. Each one has a specific job.

### `index.html` - The Structure

This file creates the layout and structure of the app. Think of it as the skeleton. It has all the sections the user sees on screen:

- The title and subtitle at the top
- The Quick Presets buttons (Small Indoor Hall, Outdoor Festival, Stadium Concert)
- Step 1: Environment buttons (Indoor or Outdoor)
- Step 2: Stand area size sliders (Width and Length)
- Step 3: Temperature slider
- Step 4: Wind direction and strength selectors (only for outdoor)
- Step 5: The speaker placement map and the result sound map, shown side by side
- The physics formulas section (hidden until the user clicks to expand)
- The limitations section at the bottom
- The footer

This file does not do any calculations. It only describes what goes where on the page. The browser reads this file first when someone opens the app.

This file connects to the other two files by including a link to `style.css` at the top and a link to `app.js` at the bottom.

### `style.css` - The Design

This file controls how the app looks. 

The CSS file handles:

- Colours (light grey background, white panels, blue for buttons and headings, green for results)
- Fonts (uses system default sans-serif for a clean modern look)
- Spacing and padding between sections
- The panel style with rounded corners and a light shadow
- Responsive layout that shows the speaker map and sound map side by side on wide screens, and stacked on top of each other on phones
- Hover effects on buttons
- The legend dots with different shapes for each colour code
- The formula boxes with a monospace font

The styling keeps the design minimal and easy to read. Light background and dark text make it comfortable to view for long periods. The side by side layout of the two maps lets the user see changes immediately without scrolling.

### `app.js` - The Brain

This file contains all the logic and calculations. Think of it as the brain that makes the app actually do something. Without this file, the user could click buttons and move sliders but nothing would happen.

The JavaScript file handles:

- Drawing the two canvas maps (the speaker placement area and the sound result area)
- Responding to user actions (tapping to add speakers, dragging to move them, tapping the × button to remove them)
- Running the physics calculations for every point in the stand area
- Calculating the score for each point and finding the best spot
- Applying the 3 metre safety radius around each speaker
- Updating the display whenever the user changes any input
- Loading the preset scenarios when a preset button is clicked
- Showing or hiding the wind panel based on indoor or outdoor selection
- Showing or hiding the physics formulas when the toggle button is clicked


The calculation runs on a grid of 60 by 45 cells covering the stand area, so there are 2700 points being calculated every time the user changes an input. Each point is checked against all speakers and all three sample frequencies (200 Hz, 1000 Hz, 4000 Hz).

## How the Three Files Work Together

1. The user opens the app in their browser
2. The browser reads `index.html` first and builds the structure
3. The browser then reads `style.css` and applies the design
4. The browser then reads `app.js` and sets up all the interactive behaviour
5. When the user does something (like dragging a speaker), `app.js` updates the canvases and the info boxes
6. The `index.html` structure stays the same but the content inside it changes based on what `app.js` calculates

## Running Locally

Download all the files into one folder. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). No server or installation is needed.

## Deploying to GitHub Pages

1. Create a new public repository on GitHub
2. Upload the files into the repository
3. Go to Settings > Pages
4. Under Source, select your main branch and root folder
5. Click Save
6. Your app will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Browser Support

Works on any modern browser that supports HTML5 canvas. Tested on Chrome, Firefox, and Safari. Works on both desktop (mouse) and mobile (touch).

## Credits

Built for the National PhysXHackathon 2026 hosted by Universiti Sains Malaysia.

Physics concepts covered align with the hackathon themes of waves, thermodynamics, and computational methods.
