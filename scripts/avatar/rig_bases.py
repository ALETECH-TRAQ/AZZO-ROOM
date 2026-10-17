"""Build inspectable skeletal draft from the prepared, untextured source bases.
This is a deformation draft, not final clothing/material production.
"""
import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]).resolve()
for model in ['central','willow']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/(model+'.glb')), merge_vertices=True)
 obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
 bpy.context.view_layer.objects.active=obj
 obj.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=0.00001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 # glTF import restores Z-up in Blender.
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 fem=model=='willow'
 data=bpy.data.armatures.new(model+'-skeleton');rig=bpy.data.objects.new('AvatarRig',data);bpy.context.collection.objects.link(rig)
 bpy.context.view_layer.objects.active=rig;rig.select_set(True);obj.select_set(False);bpy.ops.object.mode_set(mode='EDIT')
 def bone(name,head,tail,parent=None):
  b=data.edit_bones.new(name);b.head=head;b.tail=tail
  if parent:b.parent=data.edit_bones[parent]
 bone('Hips',(0,0,.94),(0,0,1.12))
 bone('Spine',(0,0,1.12),(0,0,1.48),'Hips')
 bone('Neck',(0,0,1.48),(0,0,1.76),'Spine')
 bone('Head',(0,0,1.76),(0,0,2.35),'Neck')
 for side,sign in [('Left',1),('Right',-1)]:
  shoulder=(sign*.23,0,1.57);elbow=(sign*(.43 if fem else .32),0,1.28);wrist=(sign*(.58 if fem else .37),-.015,1.04 if fem else .98)
  bone(side+'Arm',shoulder,elbow,'Spine');bone(side+'ForeArm',elbow,wrist,side+'Arm');bone(side+'Hand',wrist,(sign*(.65 if fem else .39),-.015,.94 if fem else .83),side+'ForeArm')
  bone(side+'UpLeg',(sign*.13,0,.95),(sign*.16,0,.53),'Hips');bone(side+'Leg',(sign*.16,0,.53),(sign*.17,0,.15),side+'UpLeg');bone(side+'Foot',(sign*.17,0,.15),(sign*.17,-.17,.07),side+'Leg')
 bpy.ops.object.mode_set(mode='OBJECT')
 obj.select_set(True);bpy.context.view_layer.objects.active=rig
 bpy.ops.object.parent_set(type='ARMATURE_AUTO')
 missing=sum(not any(g.weight>0 for g in v.groups) for v in obj.data.vertices)
 if missing:raise RuntimeError(f'{model}: {missing} vertices without weights; draft cannot export')
 for b in rig.pose.bones:b.rotation_mode='XYZ'
 # Separate clips, fixed roots: locomotion remains exclusively in the controller.
 actions=[]
 for name,frames,speed in [('idle',60,0),('walk',30,.42),('run',20,.65),('sit',2,0)]:
  rig.animation_data_create();action=bpy.data.actions.new(name);rig.animation_data.action=action
  for frame in range(1,frames+1):
   t=(frame-1)/(frames-1)*math.tau
   for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
   if name in ['walk','run']:
    for side,sign in [('Left',1),('Right',-1)]:
     wave=math.sin(t)*sign
     rig.pose.bones[side+'UpLeg'].rotation_euler.x=wave*speed
     rig.pose.bones[side+'Leg'].rotation_euler.x=max(0,-wave)*speed
     rig.pose.bones[side+'Arm'].rotation_euler.x=-wave*speed*.65
     rig.pose.bones[side+'ForeArm'].rotation_euler.x=-.15-abs(wave)*.15
   elif name=='sit':
    for side in ['Left','Right']:
     rig.pose.bones[side+'UpLeg'].rotation_euler.x=-math.pi/2
     rig.pose.bones[side+'Leg'].rotation_euler.x=math.pi/2
   else:rig.pose.bones['Spine'].rotation_euler.x=math.sin(t)*.008
   for b in rig.pose.bones:
    b.keyframe_insert(data_path='rotation_euler',frame=frame,group=b.name)
  action.use_fake_user=True;actions.append(action)
 rig.animation_data.action=None
 for action in actions:
  track=rig.animation_data.nla_tracks.new();track.name=action.name;track.strips.new(action.name,1,action)
 for b in rig.pose.bones:b.rotation_euler=(0,0,0)
 bpy.context.scene.render.fps=30
 obj['production_ready']=False;obj['missing']='Art-directed skin weights, UVs, materials, modular garments and hair'
 target=root/(model+'-rig-draft.glb')
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_yup=True,export_extras=True,export_animations=True,export_animation_mode='NLA_TRACKS')
 print('RIG_AUDIT',json.dumps({'model':model,'bones':len(rig.data.bones),'unweightedVertices':missing,'clips':[a.name for a in actions],'path':str(target)}))
