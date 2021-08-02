![](https://img.shields.io/badge/Foundry-v0.8.6-informational)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A0A55CQPF)

<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
<!--- ![Latest Release Download Count](https://img.shields.io/github/downloads/<user>/<repo>/latest/module.zip) -->

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->
<!--- ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2F<your-module-name>&colorB=4aa94a) -->

# VTTES to Foundry

Is your group still using Roll20 ?
Do you wish to migrate ?
But you have bougth all the books on R20 and still like the Charactermancer.
... but Foundry is SO cool !

If you know how to use VTTES, this module will help you import characters from R20 to Foundry.

![vttes-to-foundry-0 0 1](https://user-images.githubusercontent.com/8818232/126902529-d173afdf-cb7b-44f8-9bb9-e3b63d1f6e81.gif)

Warning : this module is still in development, not all features are available.

## Changelog

- Stable version : adds full character import based on compendium available items.

## Features to come next

- Items re-creation

## Known bugs

- Some features imported might trigger id error when edited or when trying to be deleted (they cannot be)

## Stability advice

In order to keep the character sheet as stable as possible, I advise you to follow these stapes :

- Create a new actor
- Import from a VTTES JSON file into the created actor
- Export the character sheet (from the Foundry "Export Data" option)
- Delete the first actor
- Recreate another one
- Import from the foundry JSON file

It should fix the inconsistent id errors I need to work on.
