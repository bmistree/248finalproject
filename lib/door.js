
/**
 * Copied almost directly from three.js' lava shader example.
 */
var composer;
var door_cube;
var uniforms;

function door_lava_fragment_shader_text()
{
    return [
        'uniform float time;',
        'uniform vec2 resolution;',

        'uniform float fogDensity;',
        'uniform vec3 fogColor;',

        'uniform sampler2D texture1;',
        'uniform sampler2D texture2;',

        'varying vec2 vUv;',

        'void main( void ) {',

        'vec2 position = -1.0 + 2.0 * vUv;',

        'vec4 noise = texture2D( texture1, vUv );',
        'vec2 T1 = vUv + vec2( 1.5, -1.5 ) * time  *0.02;',
        'vec2 T2 = vUv + vec2( -0.5, 2.0 ) * time * 0.01;',

        'T1.x += noise.x * 2.0;',
        'T1.y += noise.y * 2.0;',
        'T2.x -= noise.y * 0.2;',
        'T2.y += noise.z * 0.2;',

        'float p = texture2D( texture1, T1 * 2.0 ).a;',

        'vec4 color = texture2D( texture2, T2 * 2.0 );',
        'vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );',

        'if( temp.r > 1.0 ){ temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }',
        'if( temp.g > 1.0 ){ temp.rb += temp.g - 1.0; }',
        'if( temp.b > 1.0 ){ temp.rg += temp.b - 1.0; }',

        'gl_FragColor = temp;',

        'float depth = gl_FragCoord.z / gl_FragCoord.w;',
        'const float LOG2 = 1.442695;',
        'float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );',
        'fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );',

        'gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );',
        '}'
    ].join('\n');
}

/**
 * @param {object} door_element --- Example below:
 * 
 *   {
 *       "type": "door",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 * 
 */
function draw_door(door_element)
{
    var default_door_height = 4;
    var default_door_width = 2;
    var default_door_depth = 2;

    uniforms = {
            fogDensity: { type: "f", value: 0.45 },
            fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
            time: { type: "f", value: 1.0 },
            resolution: { type: "v2", value: new THREE.Vector2() },
            uvScale: { type: "v2", value: new THREE.Vector2( 3.0, 1.0 ) },
            texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/lava/cloud.png" ) },
            texture2: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/lava/lavatile.jpg" ) }
    };


    uniforms.texture1.value.wrapS = uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    uniforms.texture2.value.wrapS = uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    var door_material = new THREE.ShaderMaterial(
        {
            uniforms: uniforms,
	    vertexShader: document.getElementById( 'vertexShader' ).textContent,
	    fragmentShader: document.getElementById( 'fragmentShader' ).textContent            
                                                      
//            vertexShader: door_lava_vertex_shader_text(),
//            fragmentShader: door_lava_fragment_shader_text()
    } );
    // door_cube = new THREE.Mesh(
    //     new THREE.CubeGeometry(
    //         default_door_width,default_door_height,default_door_depth),
    //     door_material);


    var size = .65;
    door_cube = new THREE.Mesh( new THREE.TorusGeometry( size, 0.3, 30, 30 ), door_material );
    
    door_cube.position.x = door_element.pos.x;
    door_cube.position.y = door_element.pos.y + (default_door_height/2.0);
    door_cube.position.z = door_element.pos.z;
    

    var renderModel = new THREE.RenderPass( scene, camera );
    var effectBloom = new THREE.BloomPass( 1.25 );
    // var effectFilm = new THREE.FilmPass( 0.35, 0.95, 2048, false );
    // effectFilm.renderToScreen = false;

    composer = new THREE.EffectComposer( renderer );

    composer.addPass( renderModel );
    composer.addPass( effectBloom );
    // composer.addPass( effectFilm );

    // door_cube.overdraw = true;
    scene.add(door_cube);
    bounding_objects.push(door_cube);
}




