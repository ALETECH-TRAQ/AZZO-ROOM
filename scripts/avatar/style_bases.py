import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]).resolve();out=Path(sys.argv[sys.argv.index('--')+2]).resolve();out.mkdir(parents=True,exist_ok=True)
for model in ['central','willow']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/(model+'-rig-draft.glb')),merge_vertices=True)
 obj=next(o for o in bpy.context.scene.objects if o.type=='MESH');rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
 # Preserve deformation weights while reducing the source's dense generated topology.
 mod=obj.modifiers.new('Realtime topology','DECIMATE');mod.ratio=min(1,38000/len(obj.data.polygons));bpy.ops.object.modifier_apply(modifier=mod.name)
 obj.data.validate(verbose=True);obj.data.update()
 obj.data.materials.clear()
 material=bpy.data.materials.new('AZZO-Avatar-Vertex-Regions');material.use_nodes=True
 material.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.68
 color_node=material.node_tree.nodes.new('ShaderNodeVertexColor');color_node.layer_name='Color'
 material.node_tree.links.new(color_node.outputs['Color'],material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 obj.data.materials.append(material)
 regions=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
 def smoothstep(low,high,value):
  t=max(0.0,min(1.0,(value-low)/(high-low)))
  return t*t*(3-2*t)
 fem=model=='willow'
 for i,v in enumerate(obj.data.vertices):
  x,y,z=v.co;ax=abs(x)
  top_hair=smoothstep(2.02,2.15,z)
  back_hair=smoothstep(-.04,.06,y)*smoothstep(1.84,1.96,z)
  side_locks=(smoothstep(.18,.24,ax)*smoothstep(1.40,1.53,z)*
              (1-smoothstep(2.12,2.24,z))*smoothstep(.10,.19,abs(y))) if fem else 0
  hair=max(top_hair,back_hair,side_locks)
  shoes=1-smoothstep(.08,.19,z)
  bottom=smoothstep(.12,.20,z)*(1-smoothstep(.94,1.04,z))*(1-smoothstep(.27,.36,ax))
  sleeve_edge=.46 if fem else .38
  top=(smoothstep(.90,.98,z)*(1-smoothstep(1.56,1.66,z))*
       (1-smoothstep(sleeve_edge,sleeve_edge+.06,ax)))
  bottom*=1-hair-shoes
  top*=max(0,1-hair-shoes-bottom)
  regions.data[i].color=(hair,top,bottom,1)
 for p in obj.data.polygons:p.use_smooth=True
 obj.data.color_attributes.active_color=regions
 for e in obj.data.edges:e.use_edge_sharp=False
 if obj.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
 obj['production_ready']=False;obj['source_model']=model;obj['material_authoring']='continuous per-vertex region masks with runtime PBR colors'
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(out/(model+'.glb')),export_format='GLB',export_extras=True,export_animations=True,export_animation_mode='NLA_TRACKS')
 # inspect a neutral bind pose with authored materials.
 rig.animation_data_clear()
 for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.rotation_quaternion=(1,0,0,0)
 scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_cavity=True
 material.diffuse_color=(.64,.36,.21,1)
 scene.render.resolution_x=650;scene.render.resolution_y=850;scene.render.resolution_percentage=100
 target=Vector((0,0,1.2));bpy.ops.object.camera_add(location=(0,-5,1.7));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.8;scene.camera=cam
 scene.render.filepath=f'/tmp/{model}-styled.png';bpy.ops.render.render(write_still=True)
 print('STYLED',model,len(obj.data.polygons))
