# layered

create layered apis by merging plugins together.

To build a house really quickly, assemmble as little as possible on site.
Create all the parts at a factory, and then bring them in, set up on a concrete pad and glue them together.
You'll know that you the parts you assembled at home are good, because
you use a repeatable process. You know the parts you assembled on site are good,
because it's so simple that it can't go wrong.

This is the "framework" that was inside of [scuttlebot](https://github.com/ssbc/scuttlebot)
Inside of scuttlebot there was a plugin system, some stuff
for applying permissions, and a variety of application specific code.
The idea here, is to pull out the structure, The "frame",
let it be defined and tested cleanly.

The application should just be very simple glue code.

## License

MIT
