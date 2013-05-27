

/**
 * Controls path and intensity of particles as plants grow.
 * 
 * Want particles to be spinning essentially on a torus.
 */
function GrowthParticles(root_plant)
{
    this.center = root_plant.base_point;
    
    // create a particle system for the growth
    var particles_geometry = new THREE.Geometry();
    // now create the individual particles
    for(var particle_index = 0; particle_index < NUM_PARTICLES; ++particle_index)
    {
        var particle_point = sample_torus(INNER_TORUS_RADIUS,OUTER_TORUS_RADIUS);
        var single_particle = new THREE.Vertex(particle_point);
        particles_geometry.vertices.push(single_particle);
    }
    this.particles = new THREE.ParticleSystem(
       particles_geometry,particle_material);

    this.particles.sortParticles = true;

    this.particles.geometry.__dirtyVertices = true;
    scene.add(this.particles);
    this.num_spins_called = 1;
}

GrowthParticles.prototype.stop = function()
{
};



/**
 * @param {Vector3} new_growth_point --- The new center of the torus
 * of particles.
 * 
 * Called each time the torus is supposed to continue growing.
 */
GrowthParticles.prototype.torus_position_update = function(new_growth_point)
{
    this.particles.position.x = new_growth_point.x;
    this.particles.position.y = new_growth_point.y;
    this.particles.position.z = new_growth_point.z;
};

GrowthParticles.prototype.spin_particles = function ()
{
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        particle.y =
            .1*Math.sin(this.num_spins_called*particle.frequency) +
            particle.base_y;
    }
    this.particles.geometry.__dirtyVertices = true;
    this.num_spins_called++;
    this.particles.rotation.y += .075;
};


/**
 * @returns {int} --- Number of points
 *
 * Runs depth-first...ie, how the plant would be drawn
 * 
 */
function process_growth_points(to_append_to,root)
{
    to_append_to.push(root.base_point);
    var num_points = root.growth_points.length;
    
    for (var branch_index=0; branch_index < root.branches.length;
         ++branch_index)
    {
        num_points += process_growth_points(
            to_append_to,root.branches[branch_index]);
    }

    if (root.branches.length == 0)
        to_append_to.push(root.distant_point);

    return num_points;
}