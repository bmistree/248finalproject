NUM_GROWS_BEFORE_FULL = 20;

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
    
    // where to grow the branch from 
    this.base_point = base_point;
    // the direction this branch should grow.
    this.growth_direction = direction;

    // the length of the final branch
    this.branch_len =
        branch_len_range[0] + (branch_len_range[1] - branch_len_range[0])*Math.random();

    
    // the final point that we are supposed to grow to.
    this.distant_point = new THREE.Vector3(
        base_point.x + this.branch_len * direction.x,
        base_point.y + this.branch_len * direction.y,
        base_point.z + this.branch_len * direction.z);

    // Each time we're asked to grow, 
    this.num_grows_called = 0;

    // calculate rotation for matrix
    this.angle_of_rotation = Math.acos(this.growth_direction.y);
    this.rotation_matrix = null;
    if (isNaN(this.angle_of_rotation))
    {}
    if (this.angle_of_rotation != 0)
    {
        var axis_of_rotation = new THREE.Vector3(
            this.growth_direction.z,0,-this.growth_direction.x);
        axis_of_rotation.normalize();
        this.rotation_matrix =
            new THREE.Matrix4().makeRotationAxis( axis_of_rotation, this.angle_of_rotation );
    }
    // determine how much we need to rotate the cylinder around z axis:
    this.finished_growing = false;


    this.create_branches(
        direction,depth,branch_range,branch_len_range,gnarl_factor,
        base_point,fidelity,growth_fidelity, base_plant);
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

    // if we have finished growing this part of the plant, attempt to
    // grow rest of plant
    if (this.num_grows_called >= NUM_GROWS_BEFORE_FULL)
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
        
    // update position of particles
    var new_growth_point = new THREE.Vector3();
    var fraction_grown = this.num_grows_called / NUM_GROWS_BEFORE_FULL;
    new_growth_point.x = this.base_point.x + fraction_grown * (this.distant_point.x - this.base_point.x);
    new_growth_point.y = this.base_point.y + fraction_grown * (this.distant_point.y - this.base_point.y);
    new_growth_point.z = this.base_point.z + fraction_grown * (this.distant_point.z - this.base_point.z);
    growth_particles.torus_position_update(new_growth_point);

    var joint_part = new THREE.Mesh(
        new THREE.CylinderGeometry(
            //bottom radius
            .1,
            // top radius
            .1,
            // height
            this.branch_len/NUM_GROWS_BEFORE_FULL + .01,
            // segment radius
            10,
            // segments height
            10,
            // open ended
            true),
        new THREE.MeshNormalMaterial());
    if (this.rotation_matrix !== null)
        joint_part.applyMatrix(this.rotation_matrix);

    joint_part.position.x = this.base_point.x + fraction_grown * (this.distant_point.x - this.base_point.x);
    joint_part.position.y = this.base_point.y + fraction_grown * (this.distant_point.y - this.base_point.y);
    joint_part.position.z = this.base_point.z + fraction_grown * (this.distant_point.z - this.base_point.z);

    this.base_plant.add(joint_part);
    ++ this.num_grows_called;
    return false;
};


Plant.prototype.create_branches = function (
    direction,depth,branch_range,branch_len_range,gnarl_factor,
    base_point,fidelity,growth_fidelity, base_plant)
{
    // this is the order to grow the plant parts in
    this.branches = [];

    // create branches if final
    if (depth != 0)
    {
        var num_branches =
            branch_range[0] +
            Math.floor(Math.random()*(branch_range[1] - branch_range[0]));

        var branch_dirs = [];

        var new_branch = primary_branch_deviation(
            direction,depth,branch_range,branch_len_range,gnarl_factor,
            this.distant_point,
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
                    this.distant_point,
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
};


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

