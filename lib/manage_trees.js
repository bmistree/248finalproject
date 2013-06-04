TILE_SIDE_LEN = 20;
TILE_LEN_X = TILE_SIDE_LEN;
TILE_LEN_Z = TILE_SIDE_LEN;
VIEWABLE_RADIUS = 20;
VIEWABLE_RADIUS_BUFFER = VIEWABLE_RADIUS + TILE_SIDE_LEN;

NUM_TREES_PER_ROW = 3;
NUM_TREES_PER_COL = 4;
NUM_INITIAL_TREES = NUM_TREES_PER_ROW*NUM_TREES_PER_COL* 10;


function TreeManager(
    world_southwest_x,world_southwest_z, world_side_len)
{
    this.tree_pool = new TreePool(NUM_INITIAL_TREES);
    this.world_southwest_x = world_southwest_x;
    this.world_southwest_z = world_southwest_z;
    
    var tile_id = 0;
    this.tiles_per_side = Math.ceil(world_side_len/TILE_SIDE_LEN);
    // grid assumes indexing from 0 to large number 
    this.tile_grid = [];
    for (var row_index = 0; row_index< this.tiles_per_side; ++row_index)
    {
        var tile_col = [];
        this.tile_grid.push(tile_col);
        for (var col_index = 0; col_index < this.tiles_per_side; ++col_index)
            tile_col.push(new TreeTile(tile_id++,row_index,col_index,this.tree_pool));
    }
}

TreeManager.prototype.update = function (camera_position)
{
    // assumes that southwest corner starts at 0,0
    var c_pos_grid = {
        x: camera_position.x - this.world_southwest_x,
        y: camera_position.y,
        z: camera_position.z - this.world_southwest_z
        };
    
    // first, find all tiles that should be potentially painted
    for (var row_index = 0; row_index < this.tiles_per_side; ++row_index)
    {
        for (var col_index = 0; col_index < this.tiles_per_side; ++col_index)
        {
            var tile_obj = this.tile_grid[row_index][col_index];
            var tile_center = tile_obj.tile_center_x_z;
            if (x_z_dist(tile_center,c_pos_grid) < VIEWABLE_RADIUS_BUFFER)
                tile_obj.paint();
            else
                tile_obj.hide();
        }
    }
};

function x_z_dist(pt1,pt2)
{
    var len_squared =
        (pt1.x - pt2.x)*(pt1.x - pt2.x) +
        (pt1.z - pt2.z)*(pt1.z - pt2.z);
    return Math.sqrt(len_squared);
}

function TreePool(num_trees)
{
    this.num_trees = num_trees;
    this.available_trees = [];
    this.add_trees(this.num_trees);
}

TreePool.prototype.add_trees = function (num_trees_to_add)
{
    var tree_pos = { x:0,y:0,z:0 };
    for (var index = 0; index < num_trees_to_add; ++index)
    {
        var new_tree = draw_tree(tree_pos);
        new_tree.visible = false;
        scene.add(new_tree);
        this.available_trees.push(new_tree);
    }
};

TreePool.prototype.get_trees = function (num_trees_to_get)
{
    this.add_trees(num_trees_to_get - this.available_trees.length);
    var new_trees = this.available_trees.splice(0,num_trees_to_get);
    return new_trees;
};

TreePool.prototype.return_trees = function(trees)
{
    for (var to_append_index = 0; to_append_index < trees.length; ++to_append_index)
        this.available_trees.push(trees[to_append_index]);
};

/**
 * coords are indexed from 0 to numbe
 */
function TreeTile(tile_id,southwest_x_coord,southwest_z_coord,tree_pool)
{
    this.tree_pool = tree_pool;
    this.painted = false;
    this.tile_id = tile_id;
    this.contains_trees = false;
    this.trees = [];
    
    this.southwest_x_coord = southwest_x_coord;
    this.southwest_z_coord = southwest_z_coord;

    this.tile_center_x_z = {
        x: southwest_x_coord*TILE_LEN_X + TILE_LEN_X/2,
        z: southwest_z_coord*TILE_LEN_X + TILE_LEN_Z/2
    };
}

TreeTile.prototype.populate_trees = function()
{
    if (this.contains_trees)
        return;

    // grid of trees
    this.contains_trees = true;
    this.trees = this.tree_pool.get_trees(NUM_TREES_PER_ROW*NUM_TREES_PER_COL);

    var x_increment = TILE_LEN_X/NUM_TREES_PER_ROW;
    var z_increment = TILE_LEN_Z/NUM_TREES_PER_COL;
    for (var x_index = 0; x_index < NUM_TREES_PER_ROW; ++x_index)
    {
        for (var z_index = 0; z_index < NUM_TREES_PER_COL; ++z_index)
        {
            var x_position = this.southwest_x_coord*TILE_LEN_X + x_index*x_increment + Math.random()*3;
            var y_position = 0;
            var z_position = this.southwest_z_coord*TILE_LEN_Z + z_index*z_increment + Math.random()*3;
            
            var tree_index = x_index*NUM_TREES_PER_COL + z_index;
            this.trees[tree_index].position.x = x_position;
            this.trees[tree_index].position.y = y_position;
            this.trees[tree_index].position.z = z_position;
        }
    }
};

TreeTile.prototype.hide = function()
{
    if (! this.painted)
        return;
    
    this.painted = false;
    
    // remove each tree from the scene
    for (var tree_index in this.trees)
        this.trees[tree_index].visible = false;

    var this_param = this;
    setTimeout(
        function()
        {
            if ((this_param.contains_trees) && (! this_param.painted))
            {
                this_param.contains_trees = false;
                this_param.tree_pool.return_trees(this_param.trees);
                this_param.trees = [];
            }
        },
        1000);
};

TreeTile.prototype.paint = function()
{
    // no work to do if we're already painted
    if (this.painted)
        return;
    
    this.painted = true;
    this.populate_trees();
    for (var tree_index in this.trees)
        this.trees[tree_index].visible = true;
};


/**
 * @param {object} tree_element --- Example below:
 * 
 *   {
 *       "type": "tree",
 *       "pos": {x: 30,y:0,z:-28}
 *   }
 * 
 */
var tree_material = new THREE.MeshPhongMaterial(
    {
        color: 0x00ffaa,
        shading: THREE.FlatShading
    });

function draw_tree(tree_pos)
{
    var seed = Math.random()*1000;
    var tree = new Tree(
        {
            "seed":seed,
            "segments":8,
            "levels":5,
            "vMultiplier":1,
            "twigScale":0.28,
            "initalBranchLength":0.5,
            "lengthFalloffFactor":0.98,
            "lengthFalloffPower":1.08,
            "clumpMax":0.414,
            "clumpMin":0.282,
            "branchFactor":2.2,
            "dropAmount":0.24,
            "growAmount":0.044,
            "sweepAmount":0,
            "maxRadius":0.096,
            "climbRate":0.89,
            "trunkKink":.1,
            "treeSteps":5,
            "taperRate":0.958,
            "radiusFalloffRate":0.71,
            "twistRate":2.97,
            "trunkLength":3.95
            // "trunkMaterial":"TrunkType3",
            // "twigMaterial":"BranchType3"
        });

    var geo = new THREE.Geometry();
    TREE_MESH_DUPLICATION_FACTOR = 1;
    var num_original_tree_verts = tree.verts.length;
    for (var dup_index = 0; dup_index < TREE_MESH_DUPLICATION_FACTOR; ++dup_index)
    {
        var x_offset = dup_index*3*Math.random();
        for (var index in tree.verts)
        {
            var vertex = tree.verts[index];
            if (vertex[0] === undefined)
                console.log('Error');
        
            geo.vertices.push(
                new THREE.Vector3(x_offset + vertex[0],vertex[1],vertex[2]));
        }
    }

    for (dup_index = 0; dup_index < TREE_MESH_DUPLICATION_FACTOR; ++dup_index)
    {
        for (var index in tree.faces)
        {
            var face = tree.faces[index];
            geo.faces.push(
                new THREE.Face3(
                    face[0] + dup_index*num_original_tree_verts,
                    face[1] + dup_index*num_original_tree_verts,
                    face[2] + dup_index*num_original_tree_verts));
        }
    }
    
    geo.verticesNeedUpdate = true;
    geo.elementsNeedUpdate = true;
    geo.morphTargetsNeedUpdate = true;
    geo.uvsNeedUpdate = true;
    geo.normalsNeedUpdate = true;
    geo.colorsNeedUpdate = true;
    geo.tangentsNeedUpdate = true;
    
    var tree_mesh = new THREE.Mesh(geo,tree_material);
    tree_mesh.position.x = tree_pos.x;
    tree_mesh.position.y = tree_pos.y;
    tree_mesh.position.z = tree_pos.z;

    tree_mesh.scale.set(1.2,1 + Math.random()*.7,1.3);
    return tree_mesh;
}

