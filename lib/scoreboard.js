SCOREBOARD_DIV_ID = 'scoreboard_div';

SCOREBOARD_DISPLAY_DIV_WIDTH = 225;
SCOREBOARD_DISPLAY_DIV_HEIGHT = 100;

var DrawingConsts;
var opponent_manager;

function Scoreboard(gold_manager)
{
    this.gold_manager = gold_manager;
    
    this.winning_id = null;
    
    $('#' + DrawingConsts.DRAWING_DIV).append(
        '<div id="' + SCOREBOARD_DIV_ID + '" ' +
            // style
            'style="background-color:rgba(105,105,105,.5); ' +
            'width: ' + SCOREBOARD_DISPLAY_DIV_WIDTH + '; ' +
            'height: ' + SCOREBOARD_DISPLAY_DIV_HEIGHT + '; ' +
            'position: relative; top: -650px; left: 950px;"' +
            '></div>');
}

// gets called automatically by gold_manager
Scoreboard.prototype.update_div = function ()
{
    // skip update if opponent manager is still being initialized
    if (opponent_manager === undefined)
        return;
    
    var score_array = [];
    // add an object that corresponds to myself
    score_array.push(
        {
            points: this.gold_manager.points,
            id: null,
            color: '#ffffff'
        });

    opponent_manager.get_opponents_by_score(score_array);

    var div_html = '<table>';
    for (var index in score_array)
    {
        var opp = score_array[index];
        div_html += '<tr>';
        var disp_id = opp.id;
        var disp_color;
        if (disp_id === null)
        {
            disp_id = 'ME';
            disp_color = opp.color;
        }
        else
            disp_color = opp.color.getHexString();

        div_html += '<td style="background-color:' + disp_color + '; width: 15px;"></td>';        
        div_html += '<td>' + disp_id + '</td>';
        div_html += '<td>' + opp.points.toFixed(2) + '</td>';
        div_html += '</tr>';
    }

    div_html += '</table>';
    $('#' + SCOREBOARD_DIV_ID).html(div_html);

    this.winning_id = score_array[0].id;
};

/**
 * @returns null if local player is the one that is winning
 */
Scoreboard.prototype.get_winning_id = function()
{
    return this.winning_id;
};
