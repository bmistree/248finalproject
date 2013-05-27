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

var camera, scene, renderer, controls, clock,stats;
var particles;

function setup_particles()
{
    var start_point = new THREE.Vector3(0,0,0);
    var dest_point = new THREE.Vector3(2,3,2);
    particles = new ParticleStream(start_point,dest_point);
}

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

    setup_particles();
    start_loop();
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
    point_light.position.x = 100;
    point_light.position.y = 50;
    point_light.position.z = -50;

    // add to the scene
    scene.add(point_light);
}



function start_loop()
{
    // draw!
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function no_collisions()
{
    return true;
}

MAX_TICKS_BETWEEN_CHANGES = 5;
var ticks_between_changes = 0;
var x_pos = 0;
function animate()
{
    var clock_delta = clock.getDelta();
    controls.update(clock_delta,no_collisions);
    renderer.render(scene, camera);

    particles.update();
    if ((ticks_between_changes % MAX_TICKS_BETWEEN_CHANGES) == 0)
        particles.add_point();
    ++ticks_between_changes;
    
    // wait 100 ms and then redraw.
    setTimeout(
        function()
        {
            requestAnimationFrame(animate);
        },
        DrawingConsts.FRAME_PERIOD_MS);
}



