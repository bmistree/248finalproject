
var plant_manager, should_be_rendering, fire_manager;

/**
 * Non-movement key-presses:
 *     
 *     - p : adds plant to environment
 *     - space : fires a stream at someone
 *     - g : grab gold around you
 *     - d : dump gold around you
 * 
 */
function handle_key_press(evt)
{
    if (should_be_rendering)
    {
        // 't' add plant to environment
        if (evt.keyCode == 116)
            plant_manager.player_adds_plant();

        // space bar fires
        else if (evt.keyCode == 32)
            fire_manager.fire();

        // 'd' drops gold
        else if (evt.keyCode == 100)
            gold_manager.request_drop_gold();

        // 'g' grabs gold
        else if (evt.keyCode == 103)
            gold_manager.request_grab_gold();

        // 'p' spends gold on points
        else if (evt.keyCode == 112)
            gold_manager.request_spend_gold();
    }
}

