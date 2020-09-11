const hour = 60 * 60

class MemcachedAdaptor {
  constructor ({ client, namespace, lifetime = hour, errorHandler }) {
    this.client = client
    this.namespace = namespace
    this.lifetime = lifetime
    this.errorHandler = errorHandler
  }

  _withNamespace (key) {
    const namespace = this.namespace
    const keyWithNamespace = namespace
      ? [namespace, ...key]
      : key

    return keyWithNamespace.join(':')
  }

  set (key, value) {
    const keyWithNamespace = this._withNamespace(key)
    const operation = 'set'
    let promise = new Promise((resolve, reject) => {
      this.client.set(
        keyWithNamespace,
        JSON.stringify(value),
        this.lifetime,
        error => error
          ? this._onError(error, resolve, reject, operation, keyWithNamespace)
          : resolve()
      )
    })

    if (this.errorHandler) {
      promise = promise.catch((error) => this.errorHandler(error, operation, keyWithNamespace))
    }

    return promise
  }

  get (key) {
    const keyWithNamespace = this._withNamespace(key)
    const operation = 'get'
    let promise = new Promise((resolve, reject) => {
      this.client.get(
        keyWithNamespace,
        (error, data) => {
          if (error) {
            this._onError(error, resolve, reject, operation, keyWithNamespace)
            return
          }

          if (!data) {
            resolve(data)
            return
          }

          resolve(JSON.parse(data))
        }
      )
    })

    if (this.errorHandler) {
      promise = promise.catch((error) => this.errorHandler(error, operation, keyWithNamespace))
    }

    return promise
  }

  del (key) {
    const keyWithNamespace = this._withNamespace(key)
    const operation = 'del'
    let promise = new Promise((resolve, reject) => {
      this.client.del(
        keyWithNamespace,
        error => error
          ? this._onError(error, resolve, reject, operation, keyWithNamespace)
          : resolve()
      )
    })

    if (this.errorHandler) {
      promise = promise.catch((error) => this.errorHandler(error, operation, keyWithNamespace))
    }

    return promise
  }

  _onError (error, resolve, reject, operation, key) {
    if (this.errorHandler) {
      try {
        resolve(this.errorHandler(error, operation, key))
      } catch (nestedError) {
        reject(nestedError)
      }
    } else {
      reject(error)
    }
  }
}

module.exports = MemcachedAdaptor
