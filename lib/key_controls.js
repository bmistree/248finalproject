
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
        // 'p' add plant to environment
        if (evt.keyCode == 112)
            plant_manager.player_adds_plant();

        else if (evt.keyCode == 32)
            fire_manager.fire();

    }
}
