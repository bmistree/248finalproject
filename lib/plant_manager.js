var server_interface;
var camera;

PLANT_MANAGER_GROWTH_PERIOD_MS = 20;

var self_plant_joint_material = new THREE.MeshNormalMaterial();
var server_plant_joint_material = new THREE.MeshNormalMaterial();


function PlantManager()
{
    this.my_plants = [];
    this.other_plants = [];

    this.am_growing = false;
    this.to_grow = [];
}

PlantManager.prototype.set_grow_callback = function()
{
    if (this.am_growing)
        return;

    this.am_growing = true;
    var this_param = this;
    setTimeout(
        function()
        {
            this_param.grow();
        },PLANT_MANAGER_GROWTH_PERIOD_MS);
};

PlantManager.prototype.server_adds_plant = function (plant_pos)
{
    // prevent from adding a plant that I added myself: check if
    // already have a plant growing in that position.
    for (var my_plant_index = 0; my_plant_index < this.my_plants.length;
         ++my_plant_index)
    {
        var plant = this.my_plants[my_plant_index];
        
        if ((plant.base_point.x == plant_pos.x) &&
            (plant.base_point.y == plant_pos.y) &&
            (plant.base_point.z == plant_pos.z))
        {
            return;
        }
    }
    console.log('Server adding plant');
    var new_plant = this.add_plant(server_plant_joint_material );
    this.other_plants.push(new_plant);
};

PlantManager.prototype.grow = function ()
{
    var to_delete_from_to_grow = [];
    for (var growing_index in this.to_grow)
    {
        var to_grow = this.to_grow[growing_index];
        if (to_grow.grow())
            to_delete_from_to_grow.push(growing_index);
    }

    to_delete_from_to_grow.reverse();
    for (var to_delete_index in to_delete_from_to_grow)
    {
        var to_delete = to_delete_from_to_grow[to_delete_index];
        this.to_grow.splice(to_delete,1);
    }

    this.am_growing = false;
    if (this.to_grow.length != 0)
        this.set_grow_callback();
};


PlantManager.prototype.add_plant = function (plant_material)
{
    this.set_grow_callback();
    var direction = new THREE.Vector3(0,1,0);
    var depth = 3;
    var branch_range = [1,3];
    var branch_len_range = [3,5];
    var gnarl_factor = .5;
    var fidelity = 10;
    var growth_fidelity =  10;

    // to grow a point in front of the camera, we first need to 
    var camera_local = new THREE.Vector3( 0, 0, -4 );
    var plant_growth_point = camera_local.applyMatrix4(camera.matrixWorld);
    // ensure that plant sticks in the ground
    plant_growth_point.y = 0;

    var new_plant = new Plant(
        direction,depth,branch_range,branch_len_range,gnarl_factor,plant_growth_point,
        fidelity,growth_fidelity,undefined,plant_material);

    // probably want to add to growth_plant too
    scene.add(new_plant.base_plant);
    this.to_grow.push(new_plant);
    return new_plant;
};


/**
 * This player is trying to add a plant
 */
PlantManager.prototype.player_adds_plant = function()
{
    var new_plant = this.add_plant(self_plant_joint_material);
    console.log('Player adding plant');
    this.my_plants.push(new_plant);
    server_interface.add_plant(new_plant.base_point);
};
    
