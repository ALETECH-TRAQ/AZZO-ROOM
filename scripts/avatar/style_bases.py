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
 colors={'skin':(.64,.36,.21,1),'hair':(.075,.034,.018,1),'top':(.11,.27,.42,1),'bottom':(.025,.045,.085,1),'shoes':(.016,.023,.035,1),'eyes':(.055,.025,.014,1),'white':(.92,.92,.86,1)}
 for name,color in colors.items():
  m=bpy.data.materials.new(name);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=color;s.inputs['Roughness'].default_value=.75 if name in ['top','bottom','hair'] else .5;obj.data.materials.append(m)
 slots=list(colors)
 for p in obj.data.polygons:
  pos=sum((obj.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices)
  x,y,z=pos;ax=abs(x);fem=model=='willow';name='skin'
  if z<.18:name='shoes'
  elif z<1.0 and ax<.29:name='bottom'
  elif z<1.62 and z>=1.0 and (ax<.255 or (z>1.30 and ax<(.38 if fem else .34))):name='top'
  if z>2.11 or (z>1.84 and (y>.02 or ax>.29)) or (fem and z>1.43 and y>.1 and ax>.20):name='hair'
  if y<-.12 and 1.89<z<2.04 and .075<ax<.18:
   name='eyes' if .095<ax<.157 and 1.905<z<2.025 else 'white'
  p.material_index=slots.index(name);p.use_smooth=True
 for e in obj.data.edges:e.use_edge_sharp=False
 if obj.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
 obj['production_ready']=False;obj['source_model']=model;obj['material_authoring']='new region-based PBR materials; visual review required'
 # One shared primitive; runtime PBR material colors regions continuously.
 for poly in obj.data.polygons:poly.material_index=0
 keep=obj.data.materials[0];obj.data.materials.clear();obj.data.materials.append(keep)
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(out/(model+'.glb')),export_format='GLB',export_extras=True,export_animations=True,export_animation_mode='NLA_TRACKS')
 # inspect a neutral bind pose with authored materials.
 rig.animation_data_clear()
 for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.rotation_quaternion=(1,0,0,0)
 scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_cavity=True
 for m in obj.data.materials:m.diffuse_color=colors[m.name.split('.')[0]]
 scene.render.resolution_x=650;scene.render.resolution_y=850;scene.render.resolution_percentage=100
 target=Vector((0,0,1.2));bpy.ops.object.camera_add(location=(0,-5,1.7));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.8;scene.camera=cam
 scene.render.filepath=f'/tmp/{model}-styled.png';bpy.ops.render.render(write_still=True)
 print('STYLED',model,len(obj.data.polygons))
