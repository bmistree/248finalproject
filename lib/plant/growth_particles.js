PATH_FIDELITY = 100;
GOTO_THRESHOLD = .5;
NUM_POINTS_IN_PATH = 7;
NUM_GROWTH_PARTICLES = 30;
ROTATION_AMOUNT = .075;
PARTICLE_OFFSCREEN_HEIGHT = 50;

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

GROW_AUDIO_ID = 'electric_audio';

var DrawingConsts;
var scene;

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
    // true if we have stopped growing trees and we are animating
    // moving the points off the screen.
    this.stopped = false;
    
    this.center = root_plant.base_point;
    this.particles = this.create_particles(false);


    this.sound_id = null;
    this.am_playing_sound = false;
    
    this.particles.geometry.__dirtyVertices = true;
    scene.add(this.particles);
    this.num_spins_called = 1;
}

GrowthParticles.prototype.create_particles = function(default_hidden)
{
    // create a particle system for the growth
    var particles_geometry = new THREE.Geometry();
    // now create the individual particles
    for(var particle_index = 0; particle_index < NUM_GROWTH_PARTICLES; ++particle_index)
    {
        var particle_point = sample_torus(INNER_TORUS_RADIUS,OUTER_TORUS_RADIUS);
        var single_particle = new THREE.Vertex(particle_point);

        single_particle.hidden = false;
        if (default_hidden)
        {
            single_particle.hidden = true;
            single_particle.y = -50;
        }
        particles_geometry.vertices.push(single_particle);
    }
    var particles =  new THREE.ParticleSystem(
       particles_geometry,particle_material);
    particles.sortParticles = true;
    return particles;
};



/**
 * Doing three things:
 * 
 *   1) creates growth stream
 * 
 *   2) Creates another torus of hidden, swirling particles
 * 
 *   3) start monitoring for particles to hide from this.particles,
 *   and add to growth stream
 * 
 */
GrowthParticles.prototype.goto_point = function (destination_point)
{
    // stop playing electric audio from creating plant.
    this.stop_playing_sound();

    this.particle_stream = new ParticleStream(
        this.particles.position.clone(),destination_point,
        NUM_GROWTH_PARTICLES);

    this.source_point = this.particles.position;
    this.destination_point = destination_point.clone();
    
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        particle.hidden = false;
    }

    this.destination_particles = this.create_particles(true);
    scene.add(this.destination_particles);
    this.destination_particles.position.x = destination_point.x;
    this.destination_particles.position.y = destination_point.y;
    this.destination_particles.position.z = destination_point.z;
    
    this.in_movement_phase = true;
};


/**
 * When finished growing tree, go ahead and remove the particles by
 * having them float off screen.  Call goto_point, end of which 
 * 
 */
GrowthParticles.prototype.stop = function()
{
    this.stopped = true;
    var pt_to_go_to = new THREE.Vector3(
        this.particles.position.x,
        // just make the growth streams go outside of skybox
        PARTICLE_OFFSCREEN_HEIGHT,
        this.particles.position.z);
    this.goto_point(pt_to_go_to);

    // plant will no longer call update for us, in grow, so we must
    // call update ourselves.
    this.stop_animation();
};


/**
 * Stop animation is particles flying into the air and off screen.
 */
GrowthParticles.prototype.stop_animation = function()
{
    if (! this.update())
    {
        // stop animation is complete.  Everything has been moved
        // offscreen and we're done.
        return;
    }

    var this_param = this;
    setTimeout (
        function()
        {
            this_param.stop_animation();
        },
        DrawingConsts.FRAME_PERIOD_MS);
};



GrowthParticles.prototype.stop_playing_sound = function()
{
    stop_multi_sound(this.sound_id);
    this.am_playing_sound = false;
};

GrowthParticles.prototype.play_sound = function()
{
    this.am_playing_sound = true;
    this.sound_id = play_multi_sound(GROW_AUDIO_ID);
};

/**
 * @param {Vector3} new_growth_point --- The new center of the torus
 * of particles.
 * 
 * Called each time the torus is supposed to continue growing.
 */
GrowthParticles.prototype.torus_position_update = function(new_growth_point)
{
    if (squared_distance(new_growth_point,this.particles.position) > GOTO_THRESHOLD)
        this.goto_point(new_growth_point);
    else
    {
        if (! this.am_playing_sound)
            this.play_sound();
        
        this.particles.position.x = new_growth_point.x;
        this.particles.position.y = new_growth_point.y;
        this.particles.position.z = new_growth_point.z;
        // this.shader.uniforms['amount'].value =  Math.random()*.2 + .8;
    }
};

function squared_distance(pt1,pt2)
{
    var diff_x = pt1.x-pt2.x;
    var diff_y = pt1.y-pt2.y;
    var diff_z = pt1.z-pt2.z;
    
    return diff_x*diff_x + diff_y*diff_y + diff_z*diff_z;
}


/**
 * Returns true if particle system has arrived at the point we told it
 * to in goto_point... can call torus_position_update
 */
GrowthParticles.prototype.ready_for_torus_circle = function()
{
    return ! this.in_movement_phase;
};


/**
 * Either spins all the particles around a central point or moves
 * point to its next destination.
 * 
 * If had been in movement phase, returns true if particle stream has
 * finished.  Returns false otherwise.
 * 
 */
GrowthParticles.prototype.update = function()
{
    // update each particle's verticle position
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        if (! particle.hidden)
        {
            particle.y =
                .1*Math.sin(this.num_spins_called*particle.frequency) +
                particle.base_y;
        }

        // update destination particles as well if we're in the midst of movement
        if (this.in_movement_phase)
        {
            var dest_particle = this.destination_particles.geometry.vertices[particle_index];
            if (! dest_particle.hidden)
            {
                dest_particle.y =
                    .1*Math.sin(this.num_spins_called*dest_particle.frequency) +
                    dest_particle.base_y;
            }
        }
    }

    this.particles.geometry.__dirtyVertices = true;
    this.num_spins_called++;

    this.particles.rotation.y += ROTATION_AMOUNT;
    
    // if trying to move to a new point, then need to update particle
    // stream, etc.
    if (this.in_movement_phase)
    {
        this.destination_particles.rotation.y += ROTATION_AMOUNT;
        
        this.stream_next();
        this.update_stream();

        // check if the stream has finished sending all particles to
        // destination.
        if (this.particle_stream.finished())
        {
            // FIXME: add logic for transfering to new circular
            // particle stream at other point.
            this.in_movement_phase = false;
            this.particle_stream = undefined;

            // release destination particles
            scene.remove(this.particles);
            this.particles = this.destination_particles;
            this.destination_particles = undefined;

            // This was the end of the anmiation taking the particles
            // fully off the screen.  Release and remove all
            // particles.  Should never call update/grow on this
            // again.
            if (this.stopped)
            {
                scene.remove(this.particles);
                this.particles = undefined;
                return false;
            }
            this.particles.geometry.__dirtyVertices = true;
            return false;
        }
        this.particles.geometry.__dirtyVertices = true;
    }
    return true;
};

/**
 * Request the particle stream to update its positions.  For each
 * particle that gets removed from the stream, add it to the
 * destination stream (ie, unhide a particle from the destination
 * stream).
 */
GrowthParticles.prototype.update_stream = function()
{
    var num_particles_to_add_to_dest = this.particle_stream.update();
    if (num_particles_to_add_to_dest == 0)
        return;
    
    for (var dest_particle_index = 0;
         dest_particle_index < this.destination_particles.geometry.vertices.length;
         ++dest_particle_index)
    {
        var dest_particle = this.destination_particles.geometry.vertices[dest_particle_index];
        if (dest_particle.hidden)
        {
            dest_particle.hidden = false;
            dest_particle.y = dest_particle.base_y;
            -- num_particles_to_add_to_dest;
            if (num_particles_to_add_to_dest == 0)
                return;
        }
    }
};



GrowthParticles.prototype.stream_next = function()
{
    var all_particles_hidden = true;

    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        if (! particle.hidden)
        {
            this.particle_stream.add_point();
            // just move the particle off camera
            particle.y = -50;
            particle.hidden = true;
            break;
        }
    }
};


function get_shader()
{
    var brightness_shader_params = {
    	uniforms: {
	    "tDiffuse": { type: "t", value: null },
	    "amount":     { type: "f", value: 0.5 }
	},

	vertexShader: [
	    "varying vec2 vUv;",
	    "void main() {",
  	        "vUv = uv;",
	        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
	    "}"
	].join("\n"),

	fragmentShader: [
	    "uniform sampler2D tDiffuse;",
	    "uniform float amount;",
	    "varying vec2 vUv;",
	    "void main() {",

		"vec4 color = texture2D(tDiffuse, vUv);",
		"gl_FragColor = color*amount;",
	    "}"
	].join("\n")
    };

    var brightness_shader = new THREE.ShaderPass(brightness_shader_params);
    return brightness_shader;
}
