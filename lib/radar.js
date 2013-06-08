
RADAR_WIDTH = 225;
RADAR_HEIGHT = 225;
RADAR_UPDATE_PERIOD_MS = 100;

RADAR_CAMERA_COLOR = '#00cc00';
RADAR_CAMERA_RADIUS = 3;

RADAR_OTHER_PLANT_COLOR = '#cc0000';
RADAR_MY_PLANT_COLOR = '#0000cc';

RADAR_PLANT_WIDTH = 6;
RADAR_PLANT_HEIGHT = 6;

var plant_manager;
var DrawingConsts;


/**
 * Can paint trees to this and manages the
 */
function Radar(gl_div)
{
    console.log('Added a radar relative to gl_div');
    $('#' + gl_div).append(
        '<canvas id="radar" width="' + RADAR_WIDTH +
            '" height="' + RADAR_HEIGHT + '" ' +
            'style="background-color:rgba(255,0,0,0.5); ' +
            'position: relative; top: -680px; left: 950px;" ' +
            '></canvas>');

    this.context = document.getElementById('radar').getContext('2d');
    this.update();
}

/**
 * Returns x,y point converted to the render canvas
 */
Radar.prototype.convert_position = function(world_pos)
{
    var normalized_position_x = world_pos.x /DrawingConsts.GROUND_SIDE_LEN;
    var normalized_position_z = world_pos.z /DrawingConsts.GROUND_SIDE_LEN;
    return {
        x: normalized_position_x * RADAR_WIDTH,
        y: normalized_position_z * RADAR_HEIGHT};
};

Radar.prototype.update = function()
{
    if (plant_manager !== undefined)
    {
        this.context.clearRect(0, 0, RADAR_WIDTH, RADAR_HEIGHT);
        
        // draw camera position
        var radar_camera_position = this.convert_position(camera.position);

        this.context.fillStyle = RADAR_CAMERA_COLOR;
        this.context.beginPath();
        this.context.arc(radar_camera_position.x, radar_camera_position.y,
                RADAR_CAMERA_RADIUS, 0, Math.PI*2, true); 
        this.context.closePath();
        this.context.fill();

        // this.context.fillCircle(
        //     radar_camera_position.x,radar_camera_position.y,RADAR_CAMERA_RADIUS);

        for (var my_plant_index = 0; my_plant_index < plant_manager.my_plants.length;
             ++my_plant_index)
        {
            var plant = plant_manager.my_plants[my_plant_index];
            var plant_pos = this.convert_position(plant.base_point);
            this.draw_plant(plant_pos,RADAR_MY_PLANT_COLOR);
        }

        for (var other_plant_index = 0; other_plant_index < plant_manager.other_plants.length;
             ++other_plant_index)
        {
            var plant = plant_manager.my_plants[my_plant_index];
            var plant_pos = this.convert_position(plant.base_point);
            this.draw_plant(plant_pos,RADAR_OTHER_PLANT_COLOR);
        }
    }    
    var this_param = this;
    setTimeout(
        function()
        {
            this_param.update();
        },RADAR_UPDATE_PERIOD_MS);
};

Radar.prototype.draw_plant = function (plant_pos,dot_color)
{
    this.context.fillStyle = dot_color;
    this.context.fillRect(
        plant_pos.x,plant_pos.y,
        RADAR_PLANT_WIDTH,RADAR_PLANT_HEIGHT);
};

 