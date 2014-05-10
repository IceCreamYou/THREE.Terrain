 - Implement optimization types?
 - Implement hill algorithm (feature picking)
   See http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html
 - Support infinite terrain?
 - Add the ability to manually convolve terrain
 - Add the ability to manually paint terrain?
 - Randomly rotate scattered meshes perpendicular to the normal
 - Add water and lens flare to the demo
 - Instead of the region parameters for ScatterMeshes, add a function
   that checks whether given coordinates are acceptable for placing a mesh
 - Add an option to THREE.Terrain.Smooth to interpolate between the
   current and smoothed value
 - Make scattering be based on spatial distance, not faces
 - Fix minHeight not being properly applied
 - Fix artifacts in the value noise implementation
 - In the demo, combine the segments and size settings into just size
 - The Poisson Disk function should take width, height, numPoints,
   minDist instead of the options parameter
 - Allow the Poisson Disk function to use Perlin noise for the minDist
 - The Worley noise function should optionally take a point generation
   function and a distance function
 - Try using the terrain with a physics library
 - Add a multipass filter to apply finer-grained noise more on higher
   slopes
 - Add a method to get the terrain height at a given spatial location
 - Support using Poisson Disks for mesh scattering
 - Write documentation that's not in the code
