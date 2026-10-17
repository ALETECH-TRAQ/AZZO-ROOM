"""Preserve source silhouettes while preparing the supplied FBX bases for glTF.
Run with Blender, see docs/MESHY-AVATARS.md. Does not invent textures or rigs.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--central', required=True)
parser.add_argument('--willow', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.output).resolve()
out.mkdir(parents=True, exist_ok=True)
report = {'version': 1, 'coordinateSystem': 'Y-up, forward +Z, ground Y=0',
          'heightMeters': 2.4, 'productionReady': False, 'models': []}
for model_id, filename in [('central', args.central), ('willow', args.willow)]:
    source = Path(filename).resolve()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(source))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if len(meshes) != 1:
        raise RuntimeError('Expected exactly the audited single source mesh')
    obj = meshes[0]
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    source_info = {'filename': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                   'vertices': len(obj.data.vertices), 'triangles': len(obj.data.polygons),
                   'uvLayers': len(obj.data.uv_layers), 'materials': len(obj.data.materials),
                   'vertexGroups': len(obj.vertex_groups),
                   'armatures': len([o for o in bpy.data.objects if o.type == 'ARMATURE']),
                   'animations': len(bpy.data.actions), 'images': len(bpy.data.images)}
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Source front faces -Y in Blender; glTF exports Blender -Y as +Z.
    points = [v.co.copy() for v in obj.data.vertices]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
    scale = 2.4 / (high.z - low.z)
    for v in obj.data.vertices:
        v.co = (v.co - center) * scale
    for edge in obj.data.edges:
        edge.use_edge_sharp = False
    obj.name = 'azzo-base-' + model_id
    obj.data.name = obj.name + '-geometry'
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    for face in obj.data.polygons:
        face.use_smooth = True
    # A named neutral inspection material, NOT a replacement for authored artwork.
    material = bpy.data.materials.new('UNFINISHED-neutral-inspection')
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (0.52, 0.58, 0.64, 1)
    shader.inputs['Roughness'].default_value = 0.72
    obj.data.materials.clear()
    obj.data.materials.append(material)
    obj['source_sha256'] = source_info['sha256']
    obj['production_ready'] = False
    obj['missing'] = 'UVs, authored materials, modular garments/hair, skeleton, weights, animation clips'
    target = out / (model_id + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB',
                              use_selection=True, export_yup=True,
                              export_animations=False, export_extras=True)
    report['models'].append({'id': model_id, 'file': target.name, 'source': source_info,
                            'bytes': target.stat().st_size,
                            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                            'capabilities': {'renderable': True, 'rigged': False, 'animated': False,
                                             'modularHair': False, 'modularClothing': False,
                                             'textured': False},
                            'bounds': {'height': 2.4, 'width': (high.x-low.x)*scale,
                                       'depth': (high.y-low.y)*scale}})
(out / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
