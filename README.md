# Birthday.

A private birthday web experience made for Charity. She enters a secret code, watches a short loading and countdown sequence, then explores a small site with music, a letter, a photo gallery and a puzzle game that unlocks a surprise.

Created by Techprotocol.

## How it works

1. PIN screen: enter the secret code to continue
2. Loading screen: a day counter from 1 to 365
3. Countdown: 5 to 1, with applause starting at the "5"
4. Home: five pages (Home, Music, Message, Gallery, Surprise)
5. Puzzle: fix the picture to unlock the gift

## Project structure

CHARITY-BIRTHDAY/
  assets/        images and audio
  index.html     page markup
  main.css       all styling
  main.js        all behavior
  README.md
  .gitignore

## Assets needed

Inside the assets folder:

- applause.mp3, song.mp3
- cutie.png, favi.png, login.jpg, puzzle.jpeg
- img1.jpeg, img2.jpeg, img3.jpeg, img4.jpeg, img5.jpg, img6.jpg
- hero-bg.jpg (the surprise flyer)

## Running locally

Open the folder in VS Code and use the Live Server extension (right-click index.html, then "Open with Live Server"). Opening index.html by double-click works, but background preloading and the Share button may be blocked by the browser.

## Customizing

All of these are in main.js:

- Secret code: change CODE (default 1234)
- Letter text: change LETTER
- When applause starts: change APPLAUSE_START ('countdown' or 'pin')

## Credits

(c) Techprotocol