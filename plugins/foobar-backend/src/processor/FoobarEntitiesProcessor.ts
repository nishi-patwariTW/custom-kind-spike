/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  LocationSpec,
  processingResult,
} from '@backstage/plugin-catalog-backend';
import {
  TemplateEntityV1beta3,
  templateEntityV1beta3Validator,
} from '../../../foobar-common/src/TemplateEntityV1beta3';
// import {
//   TemplateEntityV1beta3,
//   templateEntityV1beta3Validator,
// } from '@backstage/plugin-scaffolder-common';

/** @public */
export class FoobarEntitiesProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'FoobarEntitiesProcessor';
  }

  private readonly validators = [templateEntityV1beta3Validator];

  async validateEntityKind(entity: Entity): Promise<boolean> {
    for (const validator of this.validators) {
      if (await validator.check(entity)) {
        console.log('entity validated');
        return true;
      }
    }

    return false;
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    if (
      entity.apiVersion === 'foobar.backstage.io/v1beta3' &&
      entity.kind === 'Dataset'
    ) {
      console.log('processing entity');
      const template = entity as TemplateEntityV1beta3;

      const target = template.spec.owner;
      if (target) {
        const targetRef = parseEntityRef(target, {
          defaultKind: 'Group',
          defaultNamespace: selfRef.namespace,
        });
        emit(
          processingResult.relation({
            source: selfRef,
            type: RELATION_OWNED_BY,
            target: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
          }),
        );
        emit(
          processingResult.relation({
            source: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
            type: RELATION_OWNER_OF,
            target: selfRef,
          }),
        );
      }
    }

    return entity;
  }
}
