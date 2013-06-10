DOOR_VERTEX_SHADER_ID = 'door-vertex-shader';
DOOR_FRAGMENT_SHADER_ID = 'door-fragment-shader';

// when hit a door, we must notify the server that we have hit the
// door and stop rendering with three.js
var should_be_rendering;
var server_interface;
var camera;

/**
 * Each door mesh should be loaded into collision_array.  This
 * collision array contains meshes that we should check
 */
function DoorManager(collision_array)
{
    this.all_doors = [];
    this.collision_array = collision_array;

    // heavily informed by:
    // http://threejs.org/examples/webgl_shader_lava.html    
    this.uniforms = {
            fogDensity: { type: "f", value: 0.45 },
            fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
            time: { type: "f", value: 1.0 },
            resolution: { type: "v2", value: new THREE.Vector2() },
            uvScale: { type: "v2", value: new THREE.Vector2( 3.0, 1.0 ) },
            texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/lava/cloud.png" ) },
            texture2: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/lava/lavatile.jpg" ) }

    };

    this.uniforms.texture1.value.wrapS = this.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    this.door_material = new THREE.ShaderMaterial(
        {
            uniforms: this.uniforms,
            vertexShader: document.getElementById('door-vertex-shader').textContent,
            fragmentShader: document.getElementById('door-fragment-shader').textContent
        });

    this.door_glow_material = new THREE.MeshBasicMaterial(
        { color: 0xffffff, transparent:true, opacity:0.50 } );
    
}

DoorManager.prototype.add_door = function(door_pos,door_url)
{
    var new_door = new Door(
        door_pos,door_url,this.door_material,this.door_glow_material);
    this.all_doors.push(new_door);
    this.collision_array.push(new_door.get_mesh());
};

DoorManager.prototype.update = function(camera_pos)
{
    this.uniforms.time.value += .2;
    for (var index in this.all_doors)
    {
        var door = this.all_doors[index];
        door.update();
    }
};

function Door(position,door_url,door_material, glow_material)
{
    this.position = position;
    this.door_mesh = draw_door(this.position,door_material);
    scene.add(this.door_mesh);
    this.door_mesh.visible = true;

    this.door_url = door_url;
    
    // if a player collides with this door, they get transported to
    // wherever this door points to via a call to collided_callback
    // function.
    var this_param = this;
    this.door_mesh.collided_callback = function ()
    {
        this_param.collided_callback();
    };

    this.glow_mesh = draw_door(this.position,glow_material);
    this.glow_time = 0;
    glow_scene.add(this.glow_mesh);
}

Door.prototype.get_mesh = function()
{
    return this.door_mesh;
};


Door.prototype.update = function ()
{
    var glow_frequency = .1;
    var glow_mag = .05;
    var scale_amt = 1.05 + Math.abs((glow_mag * Math.cos(glow_frequency * this.glow_time)));
    this.glow_time ++;
    this.glow_mesh.scale.set(scale_amt,scale_amt,scale_amt);
};

/**
 * @returns {bool} --- False if the camera should back up.  True
 * otherwise.
 */
Door.prototype.collided_callback = function ()
{
    // Hide the webgl-rendered div
    $('#' + DrawingConsts.DRAWING_DIV).hide();

    // Pull up an iframe with the new div's question

    $('<iframe />',
      {
          name: 'myFrame',
          id:   DrawingConsts.QUESTION_DIV_ID,
          src: this.door_url,
          width: 400,
          height: 400
      }).appendTo('body');

    should_be_rendering = false;
    server_interface.start_task();
    
    // add a button to skip question.
    // also add a listener for iframe finish
    $.receiveMessage(
        function( event ){
            console.log('Received event.');
            // destroy the iframe, unide the webgl stuff, and enable
            // rendering.
            $('#' + DrawingConsts.QUESTION_DIV_ID).remove();
            should_be_rendering = true;
            camera.position.x = camera.position.x + 3;
            server_interface.end_task(event.data);
            $('#' + DrawingConsts.DRAWING_DIV).show();
    });
};




function draw_door(door_position,door_material)
{
    var default_door_height = 4;
    var default_door_width = 2;
    var default_door_depth = .5;
    
    var door_cube = new THREE.Mesh(
        new THREE.CubeGeometry(
            default_door_width,default_door_height,default_door_depth),
        door_material);

    door_cube.position.x = door_position.x;
    door_cube.position.y = door_position.y + (default_door_height/2.0);
    door_cube.position.z = door_position.z;

    return door_cube;
}



