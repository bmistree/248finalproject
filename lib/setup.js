/**
 * This file contains the relevant constants for setting up the scene
 * and camera.
 */

DrawingConsts = { };
DrawingConsts.DIV_WIDTH = 1200;
DrawingConsts.DIV_HEIGHT = 750;
DrawingConsts.VIEW_ANGLE = 45;
DrawingConsts.ASPECT = DrawingConsts.DIV_WIDTH / DrawingConsts.DIV_HEIGHT;
DrawingConsts.NEAR = 0.1;
DrawingConsts.FAR = 10000;
DrawingConsts.DRAWING_DIV = 'gl_div';

DrawingConsts.BACKGROUND_COLOR = 0x14d1f9;

DrawingConsts.STARTING_EYE_X = 0;
DrawingConsts.STARTING_EYE_Y = 0;
DrawingConsts.STARTING_EYE_Z = 20;

DrawingConsts.FRAME_PERIOD_MS = 100;


SceneElementsConsts = {};
SceneElementsConsts.TREE_TYPE = 'tree';
SceneElementsConsts.FLOWER_TYPE = 'flower';

var camera, scene, renderer;


function drawing_init()
{
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setClearColor(DrawingConsts.BACKGROUND_COLOR,1);
    camera = new THREE.PerspectiveCamera(
        DrawingConsts.VIEW_ANGLE, DrawingConsts.ASPECT,
        DrawingConsts.NEAR, DrawingConsts.FAR);

    scene = new THREE.Scene();

    // set camera initial position
    camera.position.x = DrawingConsts.STARTING_EYE_X;
    camera.position.y = DrawingConsts.STARTING_EYE_Y;
    camera.position.z = DrawingConsts.STARTING_EYE_Z;
    camera.lookAt(new THREE.Vector3(0,0,-1));
    
    scene.add(camera);

    add_lighting();    

    // start the renderer
    renderer.setSize(DrawingConsts.DIV_WIDTH, DrawingConsts.DIV_HEIGHT);

    
    // actually append to dom
    $('body').append(
        '<div id="' + DrawingConsts.DRAWING_DIV + '"></div>');
    $('#' + DrawingConsts.DRAWING_DIV).append(renderer.domElement);

    start_loop();
    load_basic_scene();
}

function start_loop()
{
    // draw!
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function animate()
{
    renderer.render(scene, camera);
    
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
function draw_tree(tree_element)
{
    var default_tree_height = 20;
    var default_tree_radius = 1;

    var segments_radius = 50;
    var segments_height = 50;

    var tree_material = new THREE.MeshPhongMaterial(
        {
            color: 0xaaaa00,
            shading: THREE.SmoothShading
        });

    // cylinder
    // API: THREE.CylinderGeometry(bottomRadius, topRadius, height,
    // segmentsRadius, segmentsHeight, openended) (openended is
    // whether to put an end on either side)
    var tree_cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(
            default_tree_radius, default_tree_radius, default_tree_height,
            segments_radius, segments_height,false),
        tree_material);

    tree_cylinder.position.x = tree_element.pos.x;
    tree_cylinder.position.y = tree_element.pos.y + (default_tree_height/2.0);
    tree_cylinder.position.z = tree_element.pos.z;
    
    // tree_cylinder.overdraw = true;
    scene.add(tree_cylinder);
}


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