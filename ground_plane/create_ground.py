#!/usr/bin/env python

import random
import sys

SOUTHWEST_X = -50
SOUTHWEST_Z = -100

SOUTHWEST_VERTEX_NUM = 1
SOUTHEAST_VERTEX_NUM = 2
NORTHEAST_VERTEX_NUM = 3
NORTHWEST_VERTEX_NUM = 4


class Square(object):
    NOISE_FACTOR_MULTIPLIER = .8
    MIN_TESSEL_SIDE_LEN = 5
    static_vertex_number = 1

    # dict of dicts.  first index is x position, second index is z
    # position, value is vertex number to use
    static_point_dict = {}
    
    
    def __init__(self,northwest,northeast,southwest,southeast,factor):
        # height of each of these
        self.northwest = northwest
        self.northeast = northeast
        self.southeast = southeast
        self.southwest = southwest
        self.noise_factor = noise_factor

        self.partitioned = False
        self.northwest_square = None
        self.northeast_square = None
        self.southwest_square = None
        self.southeast_square = None

        self.southwest_vertex_num = None
        self.southeast_vertex_num = None
        self.northwest_vertex_num = None
        self.northeast_vertex_num = None

        self.num_children_levels = 0
        
    def obj_vertex_export(self,southwest_x, southwest_z):

        if self.num_children_levels != 0:
            dist_to_next_square = (
                self.MIN_TESSEL_SIDE_LEN * (2 ** (self.num_children_levels -1)))

            
            self.northwest_square.obj_vertex_export(
                southwest_x, southwest_z + dist_to_next_square)
            self.northeast_square.obj_vertex_export(
                southwest_x + dist_to_next_square, southwest_z + dist_to_next_square)
            self.southwest_square.obj_vertex_export(southwest_x,southwest_z)
            self.southeast_square.obj_vertex_export(
                southwest_x + dist_to_next_square, southwest_z)

            return
        
        northwest_x = southwest_x
        northwest_z = southwest_z + self.MIN_TESSEL_SIDE_LEN
        southeast_x = southwest_x + self.MIN_TESSEL_SIDE_LEN
        southeast_z = southwest_z 
        northeast_x = southwest_x + self.MIN_TESSEL_SIDE_LEN
        northeast_z = southwest_z + self.MIN_TESSEL_SIDE_LEN
        
        
        # southwest vertex
        if ((southwest_x in Square.static_point_dict) and
            (southwest_z in Square.static_point_dict[southwest_x])):
            self.southwest_vertex_num = Square.static_point_dict[southwest_x][southwest_z]
        else:
            print ('v %s %s %s' %
                   (str(southwest_x),str(self.southwest),
                    str(southwest_z)))

            self.southwest_vertex_num = Square.static_vertex_number
            if southwest_x not in Square.static_point_dict:
                Square.static_point_dict[southwest_x] = {}
            Square.static_point_dict[southwest_x][southwest_z] = self.southwest_vertex_num
            Square.static_vertex_number += 1

        # southeast vertex
        if ((southeast_x in Square.static_point_dict) and
            (southeast_z in Square.static_point_dict[southeast_x])):
            self.southeast_vertex_num = Square.static_point_dict[southeast_x][southeast_z]
        else:
            print ('v %s %s %s' %
                   (str(southeast_x),str(self.southeast),
                    str(southeast_z)))
            self.southeast_vertex_num = Square.static_vertex_number
            if southeast_x not in Square.static_point_dict:
                Square.static_point_dict[southeast_x] = {}            
            Square.static_point_dict[southeast_x][southeast_z] = self.southeast_vertex_num            
            Square.static_vertex_number += 1

        # northwest vertex
        if ((northwest_x in Square.static_point_dict) and
            (northwest_z in Square.static_point_dict[northwest_x])):
            self.northwest_vertex_num = Square.static_point_dict[northwest_x][northwest_z]
        else:        
            print ('v %s %s %s' %
                   (str(northwest_x),str(self.northwest),
                    str(northwest_z)))

            self.northwest_vertex_num = Square.static_vertex_number
            if northwest_x not in Square.static_point_dict:
                Square.static_point_dict[northwest_x] = {}
            Square.static_point_dict[northwest_x][northwest_z] = self.northwest_vertex_num
            Square.static_vertex_number += 1

        # northeast vertex
        if ((northeast_x in Square.static_point_dict) and
            (northeast_z in Square.static_point_dict[northeast_x])):
            self.northeast_vertex_num = Square.static_point_dict[northeast_x][northeast_z]
        else:
            print ('v %s %s %s' %
                   (str(northeast_x),str(self.northeast),
                    str(northeast_z)))
        
            self.northeast_vertex_num = Square.static_vertex_number
            if northeast_x not in Square.static_point_dict:
                Square.static_point_dict[northeast_x] = {}
            Square.static_point_dict[northeast_x][northeast_z] = self.northeast_vertex_num
            Square.static_vertex_number += 1
        

    def partition(self):
        '''
        @returns 4 new regions
        '''
        center = (self.northeast + self.northwest + self.southeast + self.southwest) / 4.0
        center += self.get_center_noise()

        # calculate sides' edges
        west = (self.southwest + self.northwest) / 2.0
        west += self.get_edge_noise()
        east = (self.southeast + self.northeast) / 2.0
        east += self.get_edge_noise()
        north = (self.northeast + self.northwest) / 2.0
        north += self.get_edge_noise()
        south = (self.southeast + self.southwest) / 2.0
        south += self.get_edge_noise()

        reduced_noise_factor = self.noise_factor * self.NOISE_FACTOR_MULTIPLIER
        
        self.northwest_square = Square(self.northwest,north,west,center,reduced_noise_factor)
        self.northeast_square = Square(north,self.northeast,center,east,reduced_noise_factor)
        self.southwest_square = Square(west,center,self.southwest,south,reduced_noise_factor)
        self.southeast_square = Square(center,east,south,self.southeast,reduced_noise_factor)

    def refine_children(self,amount_to_refine_children):

        if amount_to_refine_children == 0:
            return
        
        if not self.partitioned:
            self.partition()
            amount_to_refine_children -= 1

        self.num_children_levels = amount_to_refine_children
            
        if amount_to_refine_children == 0:
            return

        self.northwest_square.refine_children(amount_to_refine_children)
        self.northeast_square.refine_children(amount_to_refine_children)
        self.southwest_square.refine_children(amount_to_refine_children)
        self.southeast_square.refine_children(amount_to_refine_children)

        
    def get_center_noise(self):
        return random.random()*self.noise_factor
    
    def get_edge_noise(self):
        return random.random()*self.noise_factor

    def obj_face_export(self):
        if self.num_children_levels == 0:
            # we're at a leaf tessel.  export as single face.
            # print (
            #     'f %s/%s %s/%s %s/%s %s/%s' % (
            #         str(self.southwest_vertex_num),
            #         str(SOUTHWEST_VERTEX_NUM),
                    
            #         str(self.southeast_vertex_num),
            #         str(SOUTHEAST_VERTEX_NUM),
                    
            #         str(self.northeast_vertex_num),
            #         str(NORTHEAST_VERTEX_NUM),
                    
            #         str(self.northwest_vertex_num),
            #         str(NORTHWEST_VERTEX_NUM)))

            print (
                'f %s/%s %s/%s %s/%s %s/%s' % (
                    str(self.southeast_vertex_num),
                    str(SOUTHEAST_VERTEX_NUM),
                    
                    str(self.southwest_vertex_num),
                    str(SOUTHWEST_VERTEX_NUM),
                    
                    str(self.northwest_vertex_num),
                    str(NORTHWEST_VERTEX_NUM),
                    
                    str(self.northeast_vertex_num),
                    str(NORTHEAST_VERTEX_NUM)))
            
            return 
            
        self.northwest_square.obj_face_export()
        self.northeast_square.obj_face_export()
        self.southwest_square.obj_face_export()
        self.southeast_square.obj_face_export()
            
    def export_texture_coords(self):
        # southwest
        print 'vt 0.0 0.0 0.0'
        # southeast
        print 'vt 1.0 0.0 0.0'
        # northeast
        print 'vt 1.0 1.0 0.0'
        # northwest
        print 'vt 0.0 1.0 0.0'

        
def run(
    num_steps,initial_northwest,initial_northeast,
    initial_southwest,initial_southeast,noise_factor):

    parent_square = Square(
        initial_northwest,initial_northeast,initial_southwest,
        initial_southeast,noise_factor)
    parent_square.refine_children(num_steps)
    parent_square.obj_vertex_export(SOUTHWEST_X,SOUTHWEST_Z)
    parent_square.export_texture_coords()
    parent_square.obj_face_export()

    
if __name__ == '__main__':
    if len(sys.argv) == 1:
        initial_val = .5
        noise_factor = .9
        # run(1, initial_val,initial_val,initial_val,initial_val,noise_factor)
        # run(2, initial_val,initial_val,initial_val,initial_val,noise_factor)
        # run(5, initial_val,initial_val,initial_val,initial_val,noise_factor)
        run(7, initial_val,initial_val,initial_val,initial_val,noise_factor)
    else:
        run(
            sys.argv[1],sys.argv[2],sys.argv[3],
            sys.argv[4],sys.argv[5],sys.argv[6])
