
/**
 * @param {object} params ---
 * 
 *     * direction --- unit vector of the direction that should be growing
 * 
 *     * depth --- int when get to zero, do not branch any further
 * 
 *     * branch_range --- array lower bound to upper bound.... num
         branches at each intersection
 *
 *     * branch_len_range --- array lower bound to upper bound. 
 * 
 *     * gnarl_factor --- 0 to 1.  The gnarl factor is the amount to
         deflect off of basic path.
 * 
 *     * fidelity --- Number of points between base and end.
 * 
 *     * base_plant{optional} --- Object3D, the parent mesh of all the
         plant parts.
 * 
 * @param {point} 
 */
function Plant(
    direction,depth,branch_range,branch_len_range,gnarl_factor,
    base_point,fidelity,growth_fidelity, base_plant)
{
    this.root = false;
    if (base_plant === undefined)
    {
        this.root = true;
        base_plant = new THREE.Object3D();
    }

    this.base_plant = base_plant;

    this.growth_direction = direction;
    
    // this is the order to grow the plant parts in
    this.branches = [];
    
    this.percentage_grown = 0;
    this.base_point = base_point;

    var branch_len =
        branch_len_range[0] + (branch_len_range[1] - branch_len_range[0])*Math.random();
    
    this.distant_point = new THREE.Vector3(
        base_point.x + branch_len * direction.x,
        base_point.y + branch_len * direction.y,
        base_point.z + branch_len * direction.z);

    var intermediate_points = [];
    var prev_point = base_point;
    this.joint_len = branch_len/fidelity;    
    for (var index=0; index < fidelity; ++index)
    {
        // FIXME: use gnarl factor....
        intermediate_points.push(
            new THREE.Vector3(
                base_point.x + index*this.joint_len*direction.x,
                base_point.y + index*this.joint_len*direction.y,
                base_point.z + index*this.joint_len*direction.z));
    }
    
    this.growth_path = new THREE.SplineCurve3(
        intermediate_points).getPoints(growth_fidelity);
    this.finished_growing = false;
    this.growth_index = 0;
    
    // create branches if final
    if (depth != 0)
    {
        var num_branches =
            branch_range[0] +
            Math.floor(Math.random()*(branch_range[1] - branch_range[0]));

        var branch_dirs = [];

        var new_branch = primary_branch_deviation(
                direction,depth,branch_range,branch_len_range,gnarl_factor,
                this.growth_path[this.growth_path.length - 1],
                fidelity,growth_fidelity,this.base_plant);

        this.branches.push(new_branch);
        branch_dirs.push(new_branch.growth_direction);
        
        // want branches to roughly continue on current path
        for (var additional_branch_index =0; additional_branch_index < num_branches;
             ++additional_branch_index)
        {

            for (var num_retries = 0; num_retries < 4; ++num_retries)
            {
                new_branch = primary_branch_deviation(
                        direction,depth,branch_range,branch_len_range,gnarl_factor,
                        this.growth_path[this.growth_path.length - 1],
                        fidelity,growth_fidelity,this.base_plant);

                if (substantially_different_growth_dirs(new_branch,branch_dirs))
                {
                    this.branches.push(new_branch);
                    branch_dirs.push(new_branch.growth_direction);
                    break;
                }
            }
        }
    }
}


/***
 * @param {Branch} potential_new_branch --- Branch object
 * 
 * @param {Array} existing_branch_dirs --- Each element is a
 * THREE.Vector3 containing normalized directions for accepted
 * branches to grow to.
 * 
 * @returns {bool} --- True if potential_new_branch is in a
 * significantly different enough direction from existing branch
 * directions to be valid.
 */
function substantially_different_growth_dirs(potential_new_branch,existing_branch_dirs)
{
    var BRANCH_SIMILARITY_THRESHOLD = .95;
    
    for (var exist_branch_index = 0; exist_branch_index < existing_branch_dirs.length;
         exist_branch_index++)
    {
        var existing_branch_dir = existing_branch_dirs[exist_branch_index];
        
        if (existing_branch_dir.dot(potential_new_branch.growth_direction) > BRANCH_SIMILARITY_THRESHOLD)
            return false;
    }
    return true;
}

    
function primary_branch_deviation(
    prev_direction, prev_depth,prev_branch_range,prev_branch_len_range,prev_gnarl_factor,
    base_point,prev_fidelity, prev_growth_fidelity,base_plant)
{
    var gnarl_factor = prev_gnarl_factor;
    var fidelity = prev_fidelity;
    var growth_fidelity = prev_growth_fidelity;

    // calculate a new direction based on old direction.
    var branch_dir = prev_direction.clone();
    // theta is rotation around x-y axes
    var theta_degree_range = 15;
    var theta_change = Math.random()* theta_degree_range;
    if (Math.random() < .5)
        theta_change *= -1;

    theta_change = theta_change*3.14/180;
    var new_x = Math.cos(theta_change)*prev_direction.x - Math.sin(theta_change)*prev_direction.y;
    var new_y = Math.sin(theta_change)*prev_direction.x + Math.cos(theta_change)*prev_direction.y;

    branch_dir.x = new_x;
    branch_dir.y = new_y;
    
    // phi is a rotation around z-y axes    
    var phi_degree_range = 15;
    var phi_change = Math.random()*phi_degree_range;
    if (Math.random() < .5)
        phi_change *= -1;

    phi_change = phi_change*3.14/180;
    var new_z = Math.cos(phi_change)*branch_dir.x - Math.sin(phi_change)*branch_dir.y;
    new_y = Math.sin(phi_change)*branch_dir.x + Math.cos(phi_change)*branch_dir.y;
    branch_dir.z = new_z;
    branch_dir.y = new_y;
        
    var branch_range = prev_branch_range;
    
    var amt_to_decrease_branch_len_range = .9;
    var branch_len_range = [prev_branch_len_range[0] * amt_to_decrease_branch_len_range,
                            prev_branch_len_range[1] * amt_to_decrease_branch_len_range];

    return new Plant(
        branch_dir,prev_depth -1 ,branch_range,branch_len_range,
        gnarl_factor,base_point,
        fidelity,growth_fidelity,base_plant);
}



/**
 * @returns {bool} --- True if done growing.  False otherwise. 
 */
Plant.prototype.grow = function(growth_particles)
{
    if ((growth_particles === undefined) &&
        (this.particles === undefined))
    {        
        this.particles = new GrowthParticles(this);
        growth_particles = this.particles;
    }
    else if (growth_particles === undefined)
        growth_particles = this.particles;    

    if (this.root)
        this.particles.spin_particles();
    
    // must finish growing sub branches
    if (this.growth_index >= this.growth_path.length)
    {
        for (var branch_index in this.branches)
        {
            var branch_finished =
                this.branches[branch_index].grow(growth_particles);
            if (! branch_finished)
                return false;
        }

        if (this.root)
            this.particles.stop();
        return true;
    }

    // must finish growing this branch (before growing subbranches).
    
    var point_to_grow_to = this.growth_path[this.growth_index];
    ++this.growth_index;
    //add a cylinder to the new part to grow to.

    // bottom radius, top radius, height, segment radius, segments height, open ended
    var joint_cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(
            //bottom radius
            .1,
            // top radius
            .1,
            // height
            this.joint_len,
            // segment radius
            10,
            // segments height
            10,
            // open ended
            true),
        new THREE.MeshNormalMaterial());

    
    joint_cylinder.position.x = point_to_grow_to.x;
    joint_cylinder.position.y = point_to_grow_to.y;
    joint_cylinder.position.z = point_to_grow_to.z;
    
    this.base_plant.add(joint_cylinder);
    growth_particles.particles.position.x = point_to_grow_to.x;
    growth_particles.particles.position.y = point_to_grow_to.y;
    growth_particles.particles.position.z = point_to_grow_to.z;
    
    return false;
};


NUM_PARTICLES = 100;
particle_material = new THREE.ParticleBasicMaterial(
    {
        color: 0xFFFFFF,
        size: .7,
        map: THREE.ImageUtils.loadTexture(
            "textures/particle/particle.png"
        ),
        blending: THREE.AdditiveBlending,
        transparent: true        
    });

OUTER_TORUS_RADIUS = .8;
INNER_TORUS_RADIUS = .5;

/**
 * Assumes torus hole centered on y axis.
 * 
 * @returns {Point3}
 */
function sample_torus(inner_radius,outer_radius)
{
    // from hole in torus... in x-z plane
    var theta = Math.random()*2*Math.PI;
    var dist_to_center = (inner_radius + outer_radius) /2;

    // from center of circle in torus up or down to point.
    var circle_rad = Math.random()*(outer_radius - inner_radius)/2;
    var phi = Math.random()*2*Math.PI;
    var x_pos = Math.cos(phi)*circle_rad + dist_to_center;
    var y_pos = Math.sin(phi)*circle_rad;
    var z_pos = 0;
    
    var final_x_pos = Math.cos(theta)*x_pos + Math.sin(theta)*z_pos;
    var final_y_pos = y_pos;
    var final_z_pos = -Math.sin(theta)*x_pos + Math.cos(theta)*z_pos;

    // var rotation_matrix = [
    //     Math.cos(theta), 0, Math.sin(theta),
    //     0, 1, 0,
    //     -Math.sin(theta), 0, Math.cos(theta) ];

    var point_to_return = new THREE.Vector3(final_x_pos,final_y_pos,final_z_pos);
    point_to_return.frequency = Math.random()/2;
    point_to_return.base_y = final_y_pos;
    return point_to_return;
}


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