// Some util functions around schema manipulation to reduce size of the Property component

const schemaUtils = {}

export default schemaUtils

const objectToArray = (obj) => Object.keys(obj || {}).map(key => ({ ...obj[key], key }))

const getDeepKey = (obj, key) => {
  const keys = key.split('.')
  for (let i = 0; i < keys.length; i++) {
    if ([null, undefined].includes(obj)) break
    obj = obj[keys[i]]
  }
  return obj
}

schemaUtils.prepareFullSchema = (schema, modelWrapper, modelKey) => {
  const fullSchema = JSON.parse(JSON.stringify(schema))

  if (fullSchema.type !== 'object') return fullSchema

  // Properties as array, because order matters
  fullSchema.properties = JSON.parse(JSON.stringify(objectToArray(fullSchema.properties)))
  fullSchema.required = fullSchema.required || []
  fullSchema.dependencies = fullSchema.dependencies || {}

  // Extend schema based on satisfied dependencies
  if (fullSchema.dependencies) {
    Object.keys(fullSchema.dependencies).forEach(depKey => {
      const dep = fullSchema.dependencies[depKey]
      // cases where dependency does not apply
      if (!modelWrapper[modelKey]) return
      const val = getDeepKey(modelWrapper[modelKey], depKey)
      if ([null, undefined, false].includes(val)) return
      if (Array.isArray(val) && val.length === 0) return
      if (typeof val === 'object' && Object.keys(val).length === 0) return
      // dependency applies
      fullSchema.required = fullSchema.required.concat(dep.required || [])
      fullSchema.properties = fullSchema.properties.concat(objectToArray(dep.properties))
      // fullSchema.extraProperties = []
      if (dep.oneOf) fullSchema.oneOf = (fullSchema.oneOf || []).concat(dep.oneOf)
      if (dep.allOf) fullSchema.allOf = (fullSchema.allOf || []).concat(dep.allOf)
    })
  }
  return fullSchema
}