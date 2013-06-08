
RADAR_WIDTH = 225;
RADAR_HEIGHT = 225;

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
}

Radar.prototype.add_tree = function (world_pos)
{
    this.context.fillStyle = '#0000FF';
    this.context.fillRect(20,20,40,40);
    //this.context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
};
 