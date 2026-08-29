export const GroupsPatterns = {
  CREATE: { cmd: 'groups.create' },
  FIND_BY_ID: { cmd: 'groups.findById' },
  LIST_FOR_USER: { cmd: 'groups.listForUser' },
  ADD_MEMBER: { cmd: 'groups.addMember' },
  REMOVE_MEMBER: { cmd: 'groups.removeMember' },
  VERIFY_MEMBER: { cmd: 'groups.verifyMember' },
} as const;
