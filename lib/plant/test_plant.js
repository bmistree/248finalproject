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
var test_plant;
var composer,render_pass;


function grow_single_plant()
{
    var direction = new THREE.Vector3(0,1,0);
    var depth = 3;
    var branch_range = [1,3];
    var branch_len_range = [1,3];
    var gnarl_factor = .5;
    var base_point = new THREE.Vector3(0,0,0);
    var fidelity = 20;
    var growth_fidelity =  20;
    
    test_plant = new Plant(
        direction,depth,branch_range,branch_len_range,gnarl_factor,base_point,
        fidelity,growth_fidelity);

    
    scene.add(test_plant.base_plant);
}

function drawing_init()
{
    camera = new THREE.PerspectiveCamera(
        DrawingConsts.VIEW_ANGLE, DrawingConsts.ASPECT,
        DrawingConsts.NEAR, DrawingConsts.FAR);

    // set camera initial position
    camera.position.x = DrawingConsts.STARTING_EYE_X;
    camera.position.y = DrawingConsts.STARTING_EYE_Y;
    camera.position.z = DrawingConsts.STARTING_EYE_Z;
    camera.lookAt(new THREE.Vector3(0,0,-1));

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setClearColor(DrawingConsts.BACKGROUND_COLOR,1);

    // start the renderer
    renderer.setSize(DrawingConsts.DIV_WIDTH, DrawingConsts.DIV_HEIGHT);

    // actually append to dom
    $('body').append(
        '<div id="' + DrawingConsts.DRAWING_DIV + '"></div>');
    $('#' + DrawingConsts.DRAWING_DIV).append(renderer.domElement);

    composer = new THREE.EffectComposer( renderer);
    render_pass = new THREE.RenderPass( scene, camera );
    composer.addPass(render_pass);

    clock = new THREE.Clock();
    
    controls = new THREE.GameControls(camera);
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.05;
    controls.rollSpeed = .5;
    controls.noFly = true;
    controls.lookVertical = false;

    scene.add(camera);
    add_lighting();    

    // ensures that all the other effects also get drawn
    renderer.autoClear = false;
    grow_single_plant();
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
    //renderer.render(scene, camera);
    composer.render(.1);
    requestAnimationFrame(animate);
}

function no_collisions()
{
    return true;
}

function animate()
{
    var clock_delta = clock.getDelta();
    controls.update(clock_delta,no_collisions);
    //renderer.render(scene, camera);
    composer.render(.1);    
    test_plant.grow();

    // wait 100 ms and then redraw.
    setTimeout(
        function()
        {
            requestAnimationFrame(animate);
        },
        DrawingConsts.FRAME_PERIOD_MS);
}



