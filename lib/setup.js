/**
 * This file contains the relevant constants for setting up the scene
 * and camera.
 */

DrawingConsts = { };
DrawingConsts.DIV_WIDTH = 1200;
DrawingConsts.DIV_HEIGHT = 700;
DrawingConsts.VIEW_ANGLE = 45;
DrawingConsts.ASPECT = DrawingConsts.DIV_WIDTH / DrawingConsts.DIV_HEIGHT;
DrawingConsts.NEAR = 0.1;
DrawingConsts.FAR = 10000;
DrawingConsts.DRAWING_DIV = 'gl_div';

DrawingConsts.POS_BOX_DIV = 'pos_box_div';

DrawingConsts.BACKGROUND_COLOR = 0x14d1f9;

DrawingConsts.STARTING_EYE_X = 0;
DrawingConsts.STARTING_EYE_Y = 0;
DrawingConsts.STARTING_EYE_Z = 20;

//DrawingConsts.FRAME_PERIOD_MS = 100;
DrawingConsts.FRAME_PERIOD_MS = 10;


SceneElementsConsts = {};
SceneElementsConsts.TREE_TYPE = 'tree';
SceneElementsConsts.FLOWER_TYPE = 'flower';

var camera, scene, renderer, controls, clock,stats;

// The bounding mesh for each object that we should not collide with.
// Note: these should just be trees and doors, not flowers.
var bounding_objects = [];


THREE.Vector3.prototype.stringify = function ()
{
    var to_return = '<' + this.x.toString() + ',' +
        this.y.toString() + ',' + this.z.toString() + '>';
    return to_return;
};


function drawing_init()
{
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setClearColor(DrawingConsts.BACKGROUND_COLOR,1);
    camera = new THREE.PerspectiveCamera(
        DrawingConsts.VIEW_ANGLE, DrawingConsts.ASPECT,
        DrawingConsts.NEAR, DrawingConsts.FAR);

    clock = new THREE.Clock();
    
    scene = new THREE.Scene();

    
    // set camera initial position
    camera.position.x = DrawingConsts.STARTING_EYE_X;
    camera.position.y = DrawingConsts.STARTING_EYE_Y;
    camera.position.z = DrawingConsts.STARTING_EYE_Z;
    camera.lookAt(new THREE.Vector3(0,0,-1));

    // controls = new THREE.FirstPersonControls(camera);

    // click and drag to change perspective
    // controls = new THREE.EditorControls(camera);
    // controls = new THREE.FlyControls(camera);
    controls = new THREE.GameControls(camera);
    
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.05;
    controls.rollSpeed = .5;
    controls.noFly = true;
    controls.lookVertical = false;
    
    
    scene.add(camera);

    add_lighting();    

    // start the renderer
    renderer.setSize(DrawingConsts.DIV_WIDTH, DrawingConsts.DIV_HEIGHT);

    
    // actually append to dom
    $('body').append(
        '<div id="' + DrawingConsts.DRAWING_DIV + '"></div>');
    $('#' + DrawingConsts.DRAWING_DIV).append(renderer.domElement);


    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    $('#'+DrawingConsts.DRAWING_DIV).append( stats.domElement );

    
    start_loop();
    load_basic_scene();
}

function start_loop()
{
    // draw!
    renderer.render(scene, camera);
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

    var intersect_list = ray_cast.intersectObjects(bounding_objects,false);

    for (var index = 0; index < intersect_list.length; ++index)
    {
        var intersect_object = intersect_list[index];
        // Each intersect_object has the following fields:
        // distance: distance,
        // point: object.position,
        // face: null,
        // object: object

        if (dist_to_new_point > intersect_object.distance)
        {
            console.log('Collision');
            return false;
        }
    }
    return true;
}



function animate()
{
    controls.update(clock.getDelta(),no_collisions);
    stats.update();
    renderer.render(scene, camera);

    $('#' + DrawingConsts.POS_BOX_DIV).html(
        'X:  ' + camera.position.x.toString() + '<br/>' +
            'Y:  ' + camera.position.y.toString() + '<br/>' +
            'Z:  ' + camera.position.z.toString() + '<br/>');

    
    // wait 100 ms and then redraw.
    setTimeout(
        function()
        {
            requestAnimationFrame(animate);
        },
        DrawingConsts.FRAME_PERIOD_MS);
}


function load_basic_scene()
{
    console.log('Reading basic scene and displaying simplified trees.');
    load_scene_map('data/basic_scene.json');
}

/**
 * @param {string} scene_json_url --- The URL for a listing of all
 * trees and flowers in scene.  JSON data is a list of elements that
 * specify location for geometry. Below is an example element:
 *
 *   {
 *       "type": "tree",
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
                       draw_scene_element(scene_element);
                   }
               },
               error: function(jqxhr, text_status, error_thrown)
               {
                   alert(error_thrown);
               }
           });
}

/**
 * @param {object} scene_element --- Example below:
 * 
 *   {
 *       "type": "tree",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 * 
 */
function draw_scene_element(scene_element)
{
    if (scene_element.type == SceneElementsConsts.TREE_TYPE)
        draw_tree(scene_element);
    else if (scene_element.type == SceneElementsConsts.FLOWER_TYPE)
        draw_flower(scene_element);
    else
        console.log('Error: unknown scene element type.');
}


/**
 * @param {object} tree_element --- Example below:
 * 
 *   {
 *       "type": "tree",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 * 
 */
var seed = 2;
function draw_tree(tree_element)
{
    var tree_material = new THREE.MeshPhongMaterial(
        {
            color: 0x7700aa,
            shading: THREE.SmoothShading
        });

    ++seed;
    var tree = new Tree(
        {
            "seed":seed,
            "segments":8,
            "levels":5,
            "vMultiplier":1,
            "twigScale":0.28,
            "initalBranchLength":0.5,
            "lengthFalloffFactor":0.98,
            "lengthFalloffPower":1.08,
            "clumpMax":0.414,
            "clumpMin":0.282,
            "branchFactor":2.2,
            "dropAmount":0.24,
            "growAmount":0.044,
            "sweepAmount":0,
            "maxRadius":0.096,
            "climbRate":0.89,
            "trunkKink":.1,
            "treeSteps":5,
            "taperRate":0.958,
            "radiusFalloffRate":0.71,
            "twistRate":2.97,
            "trunkLength":3.95,
            "trunkMaterial":"TrunkType3",
            "twigMaterial":"BranchType3"
        });

    var geo = new THREE.Geometry();
    for (var index in tree.verts)
    {
        var vertex = tree.verts[index];
        if (vertex[0] === undefined)
            console.log('Error');
        
        geo.vertices.push(
            new THREE.Vector3(vertex[0],vertex[1],vertex[2]));
    }

    for (var index in tree.faces)
    {
        var face = tree.faces[index];
        geo.faces.push(
            new THREE.Face3(face[0],face[1],face[2]));
    }
    geo.verticesNeedUpdate = true;
    geo.elementsNeedUpdate = true;
    
    var tree_mesh = new THREE.Mesh(geo,tree_material);
    tree_mesh.position.x = tree_element.pos.x;
    tree_mesh.position.y = tree_element.pos.y;
    tree_mesh.position.z = tree_element.pos.z;
    scene.add(tree_mesh);
    bounding_objects.push(tree_mesh);
}


// function draw_tree(tree_element)
// {
//     var default_tree_height = 20;
//     var default_tree_radius = 1;

//     var segments_radius = 50;
//     var segments_height = 50;

//     var tree_material = new THREE.MeshPhongMaterial(
//         {
//             color: 0xaaaa00,
//             shading: THREE.SmoothShading
//         });

//     // cylinder
//     // API: THREE.CylinderGeometry(bottomRadius, topRadius, height,
//     // segmentsRadius, segmentsHeight, openended) (openended is
//     // whether to put an end on either side)
//     var tree_cylinder = new THREE.Mesh(
//         new THREE.CylinderGeometry(
//             default_tree_radius, default_tree_radius, default_tree_height,
//             segments_radius, segments_height,false),
//         tree_material);

//     tree_cylinder.position.x = tree_element.pos.x;
//     tree_cylinder.position.y = tree_element.pos.y + (default_tree_height/2.0);
//     tree_cylinder.position.z = tree_element.pos.z;

//     // add bounding box for tree
//     bounding_objects.push(tree_cylinder);
//     // tree_cylinder.overdraw = true;
//     scene.add(tree_cylinder);
// }


/**
 * @param {object} flower_element --- Example below:
 * 
 *   {
 *       "type": "flower",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 * 
 */
function draw_flower(flower_element)
{
    var default_flower_height = 2;
    var default_flower_width = 2;
    var default_flower_depth = 2;

    var flower_material = new THREE.MeshPhongMaterial(
        {
            color: 0x7700aa,
            shading: THREE.SmoothShading
        });

    var flower_cube = new THREE.Mesh(
        new THREE.CubeGeometry(
            default_flower_height,default_flower_width,default_flower_depth),
        flower_material);

    flower_cube.position.x = flower_element.pos.x;
    flower_cube.position.y = flower_element.pos.y + (default_flower_height/2.0);
    flower_cube.position.z = flower_element.pos.z;
    
    // flower_cube.overdraw = true;
    scene.add(flower_cube);
}


/**
 * Gets called when setting up original scene.  Note that for now,
 * it's just a placeholder.
 */
function add_lighting()
{
    // draw temporary lights
    var point_light = new THREE.PointLight( 0xFFFFFF );

    // set position of point light
    point_light.position.x = 10;
    point_light.position.y = 50;
    point_light.position.z = 70;

    // add to the scene
    scene.add(point_light);
}