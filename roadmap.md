## 1.2

Fix artifacts in the value noise implementation when width:length ratio > 1. http://stackoverflow.com/q/23708306/843621
Implement hill algorithm (feature picking). See http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html
Support having a function passed for the maxHeight value that takes the slope at each vertex and returns a height
   Then use it to make slopes rougher than flats in multipass generation functions


## 1.3

Add a method to get the terrain height at a given spatial location
Make scattering be based on spatial distance, not faces
Write documentation that's not in the code


## 2.0

Try using the terrain with a physics library
Implement optimization types
Support infinite terrain
Add the ability to manually convolve terrain
Add the ability to manually paint terrain
