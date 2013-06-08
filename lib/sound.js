// <audio id="multiaudio1" src="audio/flute_c_long_01.wav" preload="auto"></audio>
// <audio id="multiaudio2" src="audio/piano_chord.wav" preload="auto"></audio>
// <audio id="multiaudio3" src="audio/synth_vox.wav" preload="auto"></audio>
// <audio id="multiaudio4" src="audio/shimmer.wav" preload="auto"></audio>
// <audio id="multiaudio5" src="audio/sweep.wav" preload="auto"></audio>

// <a href="javascript:play_multi_sound('multiaudio1');">Flute</a><br />
// <a href="javascript:play_multi_sound('multiaudio2');">Piano Chord</a><br />
// <a href="javascript:play_multi_sound('multiaudio3');">Synth Vox</a><br />
// <a href="javascript:play_multi_sound('multiaudio4');">Shimmer</a><br />
// <a href="javascript:play_multi_sound('multiaudio5');">Sweep</a><br />


// number of channels
var channel_max = 10;
audiochannels = new Array();
for (a=0;a<channel_max;a++)
{
    // prepare the channels
    audiochannels[a] = new Array();
    // create a new audio object    
    audiochannels[a]['channel'] = new Audio();
    // expected end time for this channel
    audiochannels[a]['finished'] = -1;
}

var sound_id = 0;
function play_multi_sound(s) {
    return sound_id;
    
    ++sound_id;
    for (var a=0;a<audiochannels.length;a++)
    {
	var thistime = new Date();
        // is this channel finished?
	if (audiochannels[a]['finished'] < thistime.getTime())
        {			
	    audiochannels[a]['finished'] = thistime.getTime() + document.getElementById(s).duration*1000;
            audiochannels[a]['channel'].sound_id = sound_id;
	    audiochannels[a]['channel'].src = document.getElementById(s).src;
	    audiochannels[a]['channel'].load();
	    audiochannels[a]['channel'].play();
            console.log('Playing');
	    break;
	}
    }
    return sound_id;
}

function stop_multi_sound(sound_id)
{
    return;
    for (var index = 0; index < audiochannels.length; ++index)
    {
        if (audiochannels[index]['channel'].sound_id == sound_id)
        {
            audiochannels[index]['channel'].pause();
            break;
        }
    }
}