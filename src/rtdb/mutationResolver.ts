import { graphql, ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver, VariableMap } from 'graphql-anywhere';
import { DocumentNode, OperationTypeNode, OperationDefinitionNode, FragmentDefinitionNode } from 'graphql';
import {
  database
} from "firebase";
import {createFragmentMap} from 'apollo-utilities';

export interface ResolverContext {
  database: database.Database,
  operationType: OperationTypeNode,
  mainDefinition: OperationDefinitionNode | FragmentDefinitionNode;
  fragmentDefinitions: FragmentDefinitionNode[];
  exportVal: any
}

const resolver: Resolver = (
  fieldName: string,
  root: any,
  args: any,
  context: ResolverContext,
  info: ExecInfo
) => {
  const {resultKey} = info;
  const {fragmentDefinitions} = context;
  const fragmentMap = createFragmentMap(fragmentDefinitions);
  console.log(fragmentMap);
  console.log(args);
  console.log(root);
  console.log(resultKey);
  return (root && root[resultKey]) || (args && args.input) || null;
}

export default resolver;
