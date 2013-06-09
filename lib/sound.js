SOUND_MANAGER_NUM_CHANNELS = 10;

function SoundManager()
{
    this.sound_id = 0;
    this.all_channels = [];
    for (var index =0; index < SOUND_MANAGER_NUM_CHANNELS; ++index)
    {
        this.all_channels.push(
            {
                'channel': new Audio(),
                'finished': -1
            });
    }
}

/**
 * Returns a token that can use to pause/stop this sound again.
 */
SoundManager.prototype.play_multi_sound = function (sound_div_id)
{
    this.sound_id ++;

    // find a channel that isn't playing any sound currently
    for (var channel_index =0; channel_index < this.all_channels.length;
         ++channel_index)
    {
	var thistime = new Date();
        // is this channel finished?
	if (this.all_channels[channel_index]['finished'] < thistime.getTime())
        {
	    this.all_channels[channel_index]['finished'] =
                thistime.getTime() + document.getElementById(sound_div_id).duration*1000;

            this.all_channels[channel_index]['channel'].sound_id = this.sound_id;
	    this.all_channels[channel_index]['channel'].src = document.getElementById(sound_div_id).src;
	    this.all_channels[channel_index]['channel'].load();
	    this.all_channels[channel_index]['channel'].play();
            console.log('Playing new sound');
	    break;
	}
    }
    return this.sound_id;
};

/**
 * @param {int} sound_id --- Should be the same token as was returned
 * in play_multi_sound
 */
SoundManager.prototype.stop_multi_sound = function (sound_id)
{
    for (var channel_index = 0; channel_index < this.all_channels.length;
         ++channel_index)
    {
        if (this.all_channels[channel_index]['channel'].sound_id == sound_id)
        {
            this.all_channels[channel_index]['channel'].pause();
            break;
        }
    }
};
