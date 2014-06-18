## 1.2

Implement hill algorithm (feature picking). See http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html
    Allow picking what feature to use
    Additively place a bunch of features at random locations with random radii/heights
Investigate smoothed white noise with different kernels
    http://www.giantbomb.com/forums/general-discussion-30/graphics-blog-fast-fourier-terrain-generation-1480560/
    http://homepages.inf.ed.ac.uk/rbf/HIPR2/gsmooth.htm
    http://www.gamasutra.com/view/feature/131583/using_bitmaps_for_automatic_.php?print=1
    http://www.keithlantz.net/2011/11/using-fourier-synthesis-to-generate-a-fractional-brownian-motion-surface/


## 1.3

Make the Edge filter support working by radial distance from the center rather than distance from the edges
Phong lighting for generated textures
Allow making slopes rougher than flats
    Create a filter that supports compositing another heightmap / the result of a procedural function over the terrain at different intensities depending on the existing slope at each vertex
    Or create a procedural function that randomly adjusts the height of vertices with different amplitude based on their slopes
Add a method to get the terrain height at a given spatial location
    The best way to do this is probably with a raycaster
Make scattering be based on spatial distance, not faces
    This probably looks something like Voronoi cells
Write documentation that's not in the code


## 1.4

Try using the terrain with a physics library
Support morphing over time between two heightmaps
Support manually sculpting (raising/lowering) terrain


## 2.0

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


## 3.0

Implement optimization types
Support infinite terrain
