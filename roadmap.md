## 2.0

Make the API more consistent: naming (e.g. use "elevation" instead of "height"), capitalization, method and property grouping
Write documentation that's not in the code
Minify JS in /src that isn't included in the main bundle
Fix Smoothing to use a smoothing factor (a multiplier for how close the point should move to the average) instead of a weight for the target point
Add the ability for Smoothing to look in a broader neighborhood, not just the immediately surrounding 8 points
Implement helper functions to convert from a 1D Vector3 array to/from a 1D and 2D float array, and convert the generator and filter functions to operate on those
Phong lighting for generated textures
Allow making slopes rougher than flats
    Create modified smoothing functions that apply at different intensities depending on the slope
    Create a filter that supports compositing another heightmap / the result of a procedural function over the terrain at different intensities depending on the existing slope at each vertex (a generalization of the above)
    Or create a procedural function that randomly adjusts the height of vertices with different amplitude based on their slopes
Add a method to get the terrain height at a given spatial location
    The best way to do this is probably with a raycaster
Make scattering be based on spatial distance, not faces
    This probably looks something like Voronoi cells
Add a function to horizontally shift the high points of high slope faces to possibly generate some overhang


## 2.1

Make FirstPersonControls rotate on swipe and move forward on tap-and-hold like OrbitControls
Try using the terrain with a physics library
Support morphing over time between two heightmaps
Support manually sculpting (raising/lowering) terrain
Look into writing a space partitioning algorithm (like the way procedural dungeons are often built) and shape a terrain around that
Investigate search-based and agent-based terrain generation http://pcgbook.com/wp-content/uploads/chapter04.pdf
    Provide some sort of grammar for to guide terrain generation based on objectives?
    Provide some mechanism for evolution towards finding a terrain that most closely meets a set of rules?
Try IFFT(LowPassFilter(FFT(WhiteNoise()))) again as a procedural generation method
Try simulating techtonic plates as a procedural generation method as described at https://webcache.googleusercontent.com/search?q=cache:http://experilous.com/1/blog/post/procedural-planet-generation
Support a terrain "mask" for creating holes


## 2.2

Allow terrain generators and filters to partially apply by returning promises, to enable watching while the terrain is transformed


## 3.0

Erosion
    Clone the terrain
    For each original face with a slope above the angle of repose
        Reduce changes in elevation (by raising lower vertices and lowering higher vertices) to reach the angle of repose
        Set those new elevations in the clone
    Set the original to the clone
    Repeat until no changes are made
Flooding
    Methods:
        Sea level rise
            Set a maximum flood height
            For each point in the heightmap that hasn't been included in a flood-fill that doesn't touch an edge yet
                Discard the point if it is above the max flood height
                Flood-fill up to the point's height
                Mark if the flood touches an edge
                If a lower flood is encountered when flood-filling
                    If the lower flood doesn't touch an edge, add it to the current flood and keep track of it
                    Otherwise add it to the current flood, discard it, and mark the current flood as touching an edge
                    If the higher flood ends up not touching an edge, delete the lower flood
                    Otherwise delete the higher flood but not the lower flood
            Walk over the flood-fills
                Any flood-fill that doesn't touch an edge is a pond
        Rain
            Simulate units of water falling uniformly over the plane
            Each drop of water flows toward the local minimum down the path of steepest descent and accumulates
            Need to account for ponds overflowing
        Minima
            Find all the local minima, where a minimum is the lowest point in a flood-fill starting from that point with a given minimum area and the flood-fill doesn't touch the edge
                To find, sort vertices by height, then test each one (discarding flooded vertices during the flood-fill phase)
            For each minimum, find the lowest height that will spill to an edge by flood-filling at successive heights
            For each minimum, flood up to a given percentage of the lowest spill point
    When ponds are discovered, water planes need to be created for them
River generation
    Methods:
        Pick random (high-elevation) origin locations and let particles flow downward
        Use Brownian trees https://en.wikipedia.org/wiki/Brownian_tree
    A nice shape for displacement around river paths is -e^(-(2x)^2): http://www.wolframalpha.com/input/?i=-e^%28-%282x%29^2%29+from+-1+to+1
    Water planes need to be created to match river shapes
    Account for ending in a pond instead of at an edge
    Make rivers narrower and shallower at the top


## 4.0

Implement optimization types
Support infinite terrain
Try implementing spherical (planet) generation with biomes
Tunnels and caves


## Known bugs

THREE.Terrain.Gaussian() fails to smooth one edge of the terrain, resulting in some weird artifacts.
