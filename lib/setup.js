/**
 * This file contains the relevant constants for setting up the scene
 * and camera.
 */

var DrawingConsts = { };
DrawingConsts.DIV_WIDTH = 1200;
DrawingConsts.DIV_HEIGHT = 700;
DrawingConsts.VIEW_ANGLE = 45;
DrawingConsts.ASPECT = DrawingConsts.DIV_WIDTH / DrawingConsts.DIV_HEIGHT;
DrawingConsts.NEAR = 0.1;
DrawingConsts.FAR = 10000;

DrawingConsts.DRAWING_DIV = 'gl_div';
DrawingConsts.BACKGROUND_COLOR = 0x14d1f9;

DrawingConsts.GROUND_MESH_FILE = 'ground_plane/ground.obj';
DrawingConsts.GROUND_TEXTURE_FILE = 'textures/ground/fst_210n2cqkf80.jpg';

DrawingConsts.GROUND_SOUTHWEST_X = 5;
DrawingConsts.GROUND_SOUTHWEST_Y = -5;
DrawingConsts.GROUND_SOUTHWEST_Z = 0;
DrawingConsts.GROUND_SIDE_LEN = 320;

DrawingConsts.STARTING_EYE_X = 5;
DrawingConsts.STARTING_EYE_Y = 5;
DrawingConsts.STARTING_EYE_Z = 20;

DrawingConsts.FRAME_PERIOD_MS = 10;
DrawingConsts.FOG_DENSITY = 0.01;
// smaller makes more visible
DrawingConsts.GROUND_SHADER_FOG_DENSITY = .0004;
DrawingConsts.FOG_COLOR = new THREE.Vector3( 255, 255, 255 );
DrawingConsts.FOG_COLOR_HEX = 0xffffff;

DrawingConsts.QUESTION_DIV_ID = 'question_div';

var black_material = new THREE.MeshBasicMaterial( {color: 0x000000} );

DrawingConsts.SERVER_WEBSOCKET_ADDRESS = 'ws://127.0.0.1:18080/ws';
DrawingConsts.SERVER_POSITION_UPDATE_PERIOD_MS = 40;

// If true, then each update, updates the renderer... if false, then
// does not.
var should_be_rendering = true;


/** Handles the different types of elements that can be in the scene. */
SceneElementsConsts = {};
SceneElementsConsts.TREE_TYPE = 'tree';
SceneElementsConsts.FLOWER_TYPE = 'flower';
SceneElementsConsts.DOOR_TYPE = 'door';

/** Consts For skybox drawing**/
DrawingConsts.NUM_TREES = 200;
var skybox_mesh;


var camera, glow_camera;
var scene, glow_scene;
var final_composer,glow_composer;
var renderer, controls, clock,stats;
var uniforms;
var tree_manager,door_manager,gold_manager;

// connection to server for multiplayer
var server_interface;

// The bounding mesh for each object that we should not collide with.
// Note: these should just be trees and doors, not flowers.
var collision_array = [];

function drawing_init()
{
    /*** Scene setup */
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( DrawingConsts.FOG_COLOR_HEX, DrawingConsts.FOG_DENSITY);
    glow_scene = new THREE.Scene();
    
    /*** Camera setup */
    // scene camera
    camera = new THREE.PerspectiveCamera(
        DrawingConsts.VIEW_ANGLE, DrawingConsts.ASPECT,
        DrawingConsts.NEAR, DrawingConsts.FAR);
    scene.add(camera);
    camera.position.set(
        DrawingConsts.STARTING_EYE_X,
        DrawingConsts.STARTING_EYE_Y,
        DrawingConsts.STARTING_EYE_Z);
    camera.lookAt(new THREE.Vector3(0,0,-1));
    
    // glow camera
    glow_camera = new THREE.PerspectiveCamera(
        DrawingConsts.VIEW_ANGLE, DrawingConsts.ASPECT,
        DrawingConsts.NEAR, DrawingConsts.FAR);
    glow_camera.position = camera.position;
    glow_camera.rotation = camera.rotation;
    glow_scene.add( glow_camera );

    
    /*** Renderer setup */
    renderer = new THREE.WebGLRenderer( {antialias:true} );
    renderer.setSize(DrawingConsts.DIV_WIDTH, DrawingConsts.DIV_HEIGHT);
    renderer.setClearColor(DrawingConsts.BACKGROUND_COLOR,1);
    // actually append to dom
    $('body').append(
        '<div id="' + DrawingConsts.DRAWING_DIV + '" style="width: ' +
            DrawingConsts.DIV_WIDTH + '; margin:0 auto;"></div>');
    $('#' + DrawingConsts.DRAWING_DIV).append(renderer.domElement);

    /*** gameplay setup */
    
    /*** MISC setup */
    // stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    $('#'+DrawingConsts.DRAWING_DIV).append( stats.domElement );
    // lights
    add_lighting();

    // clocks
    clock = new THREE.Clock();

    /** Movement setup */
    controls = new THREE.GameControls(camera);
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.05;
    controls.rollSpeed = .5;
    controls.noFly = true;
    controls.lookVertical = false;

    /** Two phase rendering setup */
    setup_two_phase_rendering();

    /** Game logic setup */
    setup_game_managers();

    start_loop();
    load_basic_scene();
}

function setup_game_managers()
{
    server_interface = new ServerInterface(
        DrawingConsts.SERVER_WEBSOCKET_ADDRESS,
        DrawingConsts.SERVER_POSITION_UPDATE_PERIOD_MS);

    load_ground_plane();
    add_skybox();

    tree_manager = new TreeManager(
        DrawingConsts.GROUND_SOUTHWEST_X,DrawingConsts.GROUND_SOUTHWEST_Z,
        DrawingConsts.GROUND_SIDE_LEN);

    door_manager = new DoorManager(collision_array);
    gold_manager = new GoldManager();
}

function add_skybox()
{
    var default_png = 'textures/skybox/edited.png';
    var skybox_material = new THREE.MeshBasicMaterial(
    {
        map: THREE.ImageUtils.loadTexture(default_png),
        side: THREE.BackSide,
        overdraw: true
    });
    var materials = [
        skybox_material,skybox_material,skybox_material,
        skybox_material,skybox_material,skybox_material];

    skybox_mesh = new THREE.Mesh(
        new THREE.CubeGeometry(80,80,80, 1, 1, 1),
        new THREE.MeshFaceMaterial(materials));
    
    skybox_mesh.position.x = 5;
    skybox_mesh.position.y = 19;
    skybox_mesh.position.z = 0;
    scene.add( skybox_mesh );


    var skybox_black_material = new THREE.MeshBasicMaterial(
        {
            color: 0x000000,
            side: THREE.BackSide,
            overdraw: true            
        } );
    var black_materials = [
        skybox_black_material,skybox_black_material,skybox_black_material,
        skybox_black_material,skybox_black_material,skybox_black_material ];

    var glowbox_mesh = new THREE.Mesh(
        skybox_mesh.geometry.clone(),
        new THREE.MeshFaceMaterial(black_materials));


    glowbox_mesh.position = skybox_mesh.position;
    glowbox_mesh.scale = skybox_mesh.scale;
    glowbox_mesh.rotation = skybox_mesh.rotation;
    glow_scene.add(glowbox_mesh);

}

function load_ground_plane()
{
    var obj_uri  = DrawingConsts.GROUND_MESH_FILE;
    var texture_uri = DrawingConsts.GROUND_TEXTURE_FILE;
    var obj_x = DrawingConsts.GROUND_SOUTHWEST_X;
    var obj_y = DrawingConsts.GROUND_SOUTHWEST_Y;
    var obj_z = DrawingConsts.GROUND_SOUTHWEST_Z;

    var texture = THREE.ImageUtils.loadTexture(texture_uri);
    var loader = new THREE.OBJLoader();
    var geo;
    loader.addEventListener(
        'load',
        function (event)
        {
            var loaded_object = event.content;
            loaded_object.position.x = obj_x;
            loaded_object.position.y = obj_y;
            loaded_object.position.z = obj_z;

            loaded_object.traverse(
                function(mesh)
                {
                    if (mesh instanceof THREE.Mesh)
                    {
                        geo = mesh.geometry;
                        var uniforms = {
                            text1: {
                                type: 't',
                                value: texture
                            },
                            fog_density: {
                                type: 'f',
                                value: DrawingConsts.GROUND_SHADER_FOG_DENSITY
                            },
                            fog_color: { type: "v3", value: DrawingConsts.FOG_COLOR }
                        };
                        mesh.material = new THREE.ShaderMaterial(
                            {
                                uniforms: uniforms,
                                fragmentShader: document.getElementById('ground-fragment-shader').innerHTML,
                                vertexShader:  document.getElementById('ground-vertex-shader').innerHTML
                            });
                    }
                });

            scene.add(loaded_object);
            var glow_ground_mesh = new THREE.Mesh(geo.clone(), black_material);
            glow_ground_mesh.position = loaded_object.position;
            glow_ground_mesh.rotation = loaded_object.rotation;
            glow_scene.add(glow_ground_mesh);

        });
    loader.load(obj_uri);
}

function start_loop()
{
    // draw!
    // renderer.render(scene, camera);
    animate_doors();
    requestAnimationFrame(animate);
}

/**
 * @param {Vec3} current_position --- The current position of the camera
 * 
 * @param {Vec3} next_position --- The expected next position of the camera
 * 
 * @returns {bool} --- True if there are no collisions between my
 * current position and my next position.  False if there are
 * collisions with objects between me and my current position.
 */
function no_collisions(current_position,next_position)
{
    var direction = new THREE.Vector3(
        next_position.x - current_position.x ,
        next_position.y - current_position.y ,
        next_position.z - current_position.z);

    var dist_to_new_point = direction.length();
    var ray_cast = new THREE.Raycaster(
        current_position,direction.normalize());

    var intersect_list = ray_cast.intersectObjects(collision_array,false);

    for (var index = 0; index < intersect_list.length; ++index)
    {
        var intersect_object = intersect_list[index];
        var mesh_intersect_object = intersect_object.object;
        // Each intersect_object has the following fields:
        // distance: distance,
        // point: object.position,
        // face: null,
        // object: object
        
        if (dist_to_new_point > intersect_object.distance)
        {
            // test if there's a special handler for the object
            if ('collided_callback' in mesh_intersect_object)
            {
                console.log('Had collision callback.');
                return mesh_intersect_object.collided_callback();
            }

            return false;
        }
    }
    return true;
}


function animate_doors()
{
    if (door_manager !== undefined)
        door_manager.update();
    
    // wait FRAME_PERIOD_MS and then redraw.
    setTimeout(
        function()
        {
            animate_doors();
        },
        3*DrawingConsts.FRAME_PERIOD_MS);
}    


function animate()
{
    if (should_be_rendering)
    {    
        var clock_delta = clock.getDelta();
        controls.update(clock_delta,no_collisions);
        stats.update();

        
        if (tree_manager !== undefined)
            tree_manager.update(camera.position);

        if (skybox_mesh !== undefined)
        {
            //skybox mesh should follow the camera.
            skybox_mesh.position.x = camera.position.x;
            skybox_mesh.position.z = camera.position.z;
        }
        // probably want to use clock_delta instead here
        // tell each side to move rendering forward in time
        glow_composer.render( .1);
        final_composer.render(.1 );
    }

    // wait FRAME_PERIOD_MS and then redraw.
    setTimeout(
        function()
        {
            requestAnimationFrame(animate);
        },
        DrawingConsts.FRAME_PERIOD_MS);
}


function load_basic_scene()
{
    console.log('Requesting json scene element file from server.');
    load_scene_map('data/basic_scene.json');
}

/**
 * @param {string} scene_json_url --- The URL for a listing of all
 * trees and flowers in scene.  JSON data is a list of elements that
 * specify location for geometry. Below is an example element:
 *
 *   {
 *       "type": "door",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 *
 */
function load_scene_map(scene_json_url)
{
    $.ajax({
               url: scene_json_url,
               type: 'GET',
               dataType: 'json',
               success: function(scene_array)
               {
                   for (var index in scene_array)
                   {
                       var scene_element = scene_array[index];
                       add_scene_element(scene_element);
                   }
               },
               error: function(jqxhr, text_status, error_thrown)
               {
                   alert(error_thrown);
               }
           });
}


/**
 * We want to paint lots of trees on the screen so that we can take a
 * screenshot and use it as a texture.  This code paints all those trees.
 */
function draw_scene_for_skybox_texture()
{
    // draw the rest of the trees
    var x_pos_base = -50;
    var z_pos_base = 0;
    var tree_obj = {
        type: 'tree',
        pos: {
            x: null,
            y: 0,
            z: null
        }
    };
    // center trees on camera position
    var x_tree_spacing = 3.5;
    var z_tree_spacing = 3.5;
    var num_trees_in_dim = Math.sqrt(DrawingConsts.NUM_TREES);
    var x_base = camera.position.x - (num_trees_in_dim/2)*x_tree_spacing;
    var z_base = camera.position.z - (num_trees_in_dim/2)*z_tree_spacing;

    var squared_radius_from_center = 40*40;
    for (var x_tree_index = 0; x_tree_index < num_trees_in_dim; ++x_tree_index)
    {
        for (var z_tree_index = 0; z_tree_index < num_trees_in_dim/2; ++z_tree_index)
        {
            tree_obj.pos.x = x_base + x_tree_index*x_tree_spacing + Math.random()*4;
            tree_obj.pos.z = z_base + z_tree_index*z_tree_spacing + Math.random()*2;

            var dist_squared =
                (tree_obj.pos.x - camera.position.x)*(tree_obj.pos.x - camera.position.x) +
                (tree_obj.pos.z - camera.position.z)*(tree_obj.pos.z - camera.position.z);

            if (dist_squared < squared_radius_from_center)
                continue;

            trees_to_load.push(
                {
                    type: 'tree',
                    pos: {
                        x: tree_obj.pos.x,
                        y: 0,
                        z: tree_obj.pos.z
                    }
                });
        }
    }
}


/**
 * @param {object} scene_element --- Example below:
 * 
 *   {
 *       "type": "tree",
 *       "pos": {x: 30,y:0,z:-28},
 *       "door_url": "http://door_url.com"
 *   }
 * 
 */
function add_scene_element(scene_element)
{
    if (scene_element.type == SceneElementsConsts.DOOR_TYPE)
        door_manager.add_door(scene_element.pos,scene_element.door_url);
    else
        console.log('Error: unknown scene element type.');
}

/**
 * Heavily inspired by: http://stemkoski.blogspot.com/2013/03/using-shaders-and-selective-glow.html
 * 
 * 1) Render glow to separate target, render_target_glow
 * 
 * 2) Create an effect composer, glow_composer, this takes in the
 *    render target, and adds effects and passes to them.  
 * 
 * 3) Add my own render pass, which incorporates the glow scene
 * 
 * 4) Start adding passes to this effect composer: adding
 *    horizontal and verical blur
 *
 * 5) Final composer blends the results of the glow composer with the
 *    results of the actual scene and outpus to screen.
 *  
 * 3) Blend glow with actual scene     
 */
function setup_two_phase_rendering()
{
    //First: render glow to a separate target.      
    var render_target_params = {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, 
        format: THREE.RGBFormat, stencilBuffer: false };

    var render_target_glow = new THREE.WebGLRenderTarget(
        DrawingConsts.DIV_WIDTH,DrawingConsts.DIV_HEIGHT, render_target_params );

    // 2 from above
    glow_composer = new THREE.EffectComposer( renderer, render_target_glow );

    // 3 from above
    var glow_render_pass = new THREE.RenderPass( glow_scene, glow_camera );
    glow_composer.addPass( glow_render_pass );

    // 4 from above
    var hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
    var vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
    hblur.uniforms[ "h" ].value = 2 / DrawingConsts.DIV_WIDTH;
    vblur.uniforms[ "v" ].value = 2 / DrawingConsts.DIV_HEIGHT;
    glow_composer.addPass( hblur );
    glow_composer.addPass( vblur );

    // 5 from above
    final_composer = new THREE.EffectComposer( renderer, render_target_glow );

    // prepare the final render's passes
    var final_scene_render_model = new THREE.RenderPass( scene, camera );
    final_composer.addPass( final_scene_render_model );

    var additive_blending = new THREE.ShaderPass( THREE.AdditiveBlendShader, "tDiffuse1" );

    // when using an effect composer, the scene is rendered into
    // renderTarget2 or renderTarget1, still a little unclear how to
    // decide which to use.  Either way, it should contain a 2d color
    // map that essentially contains how the glow scene by itself
    // would have looked if we had just rendered that.  We will later
    // blend that glow scene with the final scene in final_shader.
    additive_blending.uniforms[ 'tDiffuse2' ].value = glow_composer.renderTarget2;
    additive_blending.renderToScreen = true;
    final_composer.addPass( additive_blending );
}



/**
 * Gets called when setting up original scene.  Note that for now,
 * it's just a placeholder.
 */
function add_lighting()
{
    // single point ligth for scene
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);

    glow_scene.add( new THREE.PointLight( 0xffffff ) );
    glow_scene.add( new THREE.AmbientLight( 0xffffff ) );
}